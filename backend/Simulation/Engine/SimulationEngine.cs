using CafeteriaSimulacion.Api.Domain.Entities;
using CafeteriaSimulacion.Api.Domain.Enums;
using CafeteriaSimulacion.Api.Simulation.Model;
using CafeteriaSimulacion.Api.Simulation.Stochastic;

namespace CafeteriaSimulacion.Api.Simulation.Engine;

public class SimulationEngine : ISimulationEngine
{
    public SimulationResult RunSimulation(SimulationParameters parameters)
    {
        var stochastic = new StochasticGenerator(parameters.Seed);

        // Reloj de la simulación
        double clock = 0.0;
        double horizon = parameters.HorizonMinutes > 0 ? parameters.HorizonMinutes : 60.0;

        // Cola de prioridad de eventos ordenados por tiempo
        var eventQueue = new PriorityQueue<InternalSimEvent, double>();

        // Recursos del sistema
        var cashiers = new List<CashierState>
        {
            new CashierState(1),
            new CashierState(2)
        };

        // 20 mesas de 4 (M01-M20) y 10 mesas de 2 (M21-M30)
        var tables = new List<TableState>();
        for (int i = 1; i <= parameters.TablesOf4Count; i++)
        {
            tables.Add(new TableState(i, 4));
        }
        for (int i = 1; i <= parameters.TablesOf2Count; i++)
        {
            tables.Add(new TableState(parameters.TablesOf4Count + i, 2));
        }

        // Fila única FIFO para los cajeros
        var cashierQueue = new Queue<SimCustomer>();

        // Registros
        var allGroups = new List<SimGroup>();
        var allCustomers = new List<SimCustomer>();
        var eventsLog = new List<SimulationEvent>();

        int groupIdCounter = 0;
        int maxQueueLength = 0;

        // Variables para estadísticas acumuladas en el tiempo (integrales)
        double lastChairAreaUpdateTime = 0.0;
        double accumulatedChairMinutes = 0.0;

        void UpdateChairArea(double currentSimTime)
        {
            double dt = currentSimTime - lastChairAreaUpdateTime;
            if (dt > 0)
            {
                int currentOccupiedChairs = tables.Sum(t => t.OccupiedChairs);
                accumulatedChairMinutes += currentOccupiedChairs * dt;
                foreach (var t in tables)
                {
                    t.TotalChairMinutesUsed += t.OccupiedChairs * dt;
                }
                lastChairAreaUpdateTime = currentSimTime;
            }
        }

        void LogEvent(EventType type, string entityRef, string description)
        {
            eventsLog.Add(new SimulationEvent
            {
                TimestampMinute = Math.Round(clock, 2),
                EventType = type,
                EntityRef = entityRef,
                Description = description,
                QueueLengthAtEvent = cashierQueue.Count,
                FreeChairsAtEvent = tables.Sum(t => t.FreeChairs),
                BusyCashiersAtEvent = cashiers.Count(c => c.IsBusy)
            });
        }

        void ScheduleEvent(double time, EventType type, string entityRef, string description, Action action)
        {
            var simEvent = new InternalSimEvent(time, type, entityRef, description, action);
            eventQueue.Enqueue(simEvent, time);
        }

        // Intentar pasar clientes de la fila FIFO a cajeros desocupados
        void CheckCashierQueue()
        {
            while (cashierQueue.Count > 0)
            {
                var idleCashier = cashiers.FirstOrDefault(c => !c.IsBusy);
                if (idleCashier == null) break;

                var nextCustomer = cashierQueue.Dequeue();

                // Si por alguna razón el cliente ya no está esperando en fila (ej. abandonó), saltar
                if (nextCustomer.Status != CustomerStatus.EsperandoFila) continue;

                idleCashier.IsBusy = true;
                idleCashier.CurrentCustomer = nextCustomer;
                idleCashier.LastServiceStartTime = clock;
                idleCashier.TotalCustomersServed++;

                nextCustomer.CashierId = idleCashier.Id;
                nextCustomer.ServiceStartMinute = clock;

                double serviceDuration = stochastic.NextCashierServiceTime();
                double serviceEndTime = clock + serviceDuration;

                LogEvent(EventType.InicioAtencionCaja, $"Cliente G{nextCustomer.GroupId}-C{nextCustomer.IndexInGroup}",
                    $"Inicia atención en Caja #{idleCashier.Id}. Duración estimada: {serviceDuration:F2} min.");

                int cashierId = idleCashier.Id;
                ScheduleEvent(serviceEndTime, EventType.FinAtencionCaja, $"Caja #{cashierId}",
                    $"Fin de atención en Caja #{cashierId} para cliente G{nextCustomer.GroupId}-C{nextCustomer.IndexInGroup}.", () =>
                    {
                        var c = cashiers.First(x => x.Id == cashierId);
                        var servedCust = c.CurrentCustomer;

                        double busyDuration = clock - c.LastServiceStartTime;
                        c.TotalBusyTimeMinutes += busyDuration;
                        c.IsBusy = false;
                        c.CurrentCustomer = null;

                        if (servedCust != null)
                        {
                            servedCust.ServiceEndMinute = clock;

                            LogEvent(EventType.FinAtencionCaja, $"Cliente G{servedCust.GroupId}-C{servedCust.IndexInGroup}",
                                $"Terminó en Caja #{cashierId}. Pedido pasa a preparación en cocina.");

                            // Comienza preparación de comida
                            double prepTime = stochastic.NextPreparationTime();
                            double orderReadyTime = clock + prepTime;

                            ScheduleEvent(orderReadyTime, EventType.EntregaPedido, $"Cliente G{servedCust.GroupId}-C{servedCust.IndexInGroup}",
                                $"Pedido listo tras preparación ({prepTime:F2} min).", () =>
                                {
                                    servedCust.OrderReadyMinute = clock;

                                    // Si es para llevar, el cliente se retira inmediatamente
                                    if (servedCust.IsTakeaway)
                                    {
                                        servedCust.Status = CustomerStatus.AtendidoParaLlevar;
                                        servedCust.ExitMinute = clock;

                                        LogEvent(EventType.SalidaCafeteria, $"Cliente G{servedCust.GroupId}-C{servedCust.IndexInGroup}",
                                            $"Pedido para llevar recogido. El cliente sale de la cafetería con su compra.");
                                    }
                                    else
                                    {
                                        // Requiere mesa para consumir en la cafetería
                                        // Verificamos si el grupo completo ya está listo o se ubica
                                        AssignTableForCustomerOrGroup(servedCust);
                                    }
                                });
                        }

                        // Verificar si hay más clientes en fila para este cajero
                        CheckCashierQueue();
                    });
            }
        }

        void AssignTableForCustomerOrGroup(SimCustomer customer)
        {
            UpdateChairArea(clock);

            var group = allGroups.FirstOrDefault(g => g.GroupId == customer.GroupId);
            int groupSize = group?.Size ?? 1;

            // Si el grupo ya tiene mesa asignada previamente por otro compañero
            if (group != null && group.AssignedTableNumber.HasValue)
            {
                var assignedTable = tables.FirstOrDefault(t => t.TableNumber == group.AssignedTableNumber.Value);
                customer.TableNumber = group.AssignedTableNumber;
                customer.TableCapacity = assignedTable?.Capacity;
                customer.TableSeatedMinute = clock;

                StartDining(customer, group);
                return;
            }

            // Política de asignación de mesa:
            // 1. Buscar mesa vacía adecuada
            TableState? chosenTable = null;

            if (groupSize <= 2)
            {
                // Preferir mesa de 2 vacía; si no hay, mesa de 4 vacía
                chosenTable = tables.FirstOrDefault(t => t.Capacity == 2 && t.IsCompletelyFree)
                           ?? tables.FirstOrDefault(t => t.Capacity == 4 && t.IsCompletelyFree);
            }
            else
            {
                // Grupos de 3 o 4: buscar mesa de 4 vacía
                chosenTable = tables.FirstOrDefault(t => t.Capacity == 4 && t.IsCompletelyFree);
            }

            bool shared = false;

            // 2. Si no hay mesa vacía, evaluar si aceptan compartir mesa
            if (chosenTable == null)
            {
                bool willingToShare = (group != null) ? group.WillingToShareTable : stochastic.NextWillingToShareTable();
                customer.WillingToShareTable = willingToShare;

                if (willingToShare)
                {
                    // Buscar mesa con sillas libres suficientes
                    chosenTable = tables
                        .Where(t => t.FreeChairs >= groupSize)
                        .OrderBy(t => t.FreeChairs) // Mejor ajuste (best fit)
                        .FirstOrDefault();

                    if (chosenTable != null)
                    {
                        shared = true;
                    }
                }
            }

            // 3. Si aún así no hay mesa disponible
            if (chosenTable == null)
            {
                // Evaluar si abandona por falta de silla: Bernoulli(0.20)
                bool leavesIfNoChair = stochastic.NextLeavesIfNoTable();
                customer.HadToLeaveForNoTable = leavesIfNoChair;

                if (leavesIfNoChair)
                {
                    customer.Status = CustomerStatus.AbandonoFaltaSilla;
                    customer.ExitMinute = clock;

                    LogEvent(EventType.AbandonoSinSilla, $"Grupo G{customer.GroupId}",
                        $"No hay sillas suficientes ({groupSize} requeridas) y el cliente/grupo decide retirarse (Abandono por falta de silla).");
                    return;
                }
                else
                {
                    // El 80% restante opta por pedir para llevar su pedido ya entregado
                    customer.Status = CustomerStatus.AtendidoParaLlevar;
                    customer.IsTakeaway = true;
                    customer.ExitMinute = clock;

                    LogEvent(EventType.SalidaCafeteria, $"Grupo G{customer.GroupId}",
                        $"Sin mesa disponible pero deciden llevar su pedido para consumir fuera (Atendido para llevar de contingencia).");
                    return;
                }
            }

            // 4. Asignación exitosa de mesa
            chosenTable.OccupiedChairs += groupSize;
            chosenTable.TotalGroupsHosted++;

            if (group != null)
            {
                group.AssignedTableNumber = chosenTable.TableNumber;
                group.AssignedTableCapacity = chosenTable.Capacity;
            }

            customer.TableNumber = chosenTable.TableNumber;
            customer.TableCapacity = chosenTable.Capacity;
            customer.SharedTable = shared;
            customer.TableSeatedMinute = clock;

            LogEvent(EventType.AsignacionMesa, $"Grupo G{customer.GroupId} ({groupSize} pers.)",
                $"Mesa #{chosenTable.TableNumber} (Cap: {chosenTable.Capacity}, Ocupadas: {chosenTable.OccupiedChairs}) asignada. " +
                (shared ? "[Mesa compartida]" : "[Mesa exclusiva]"));

            StartDining(customer, group);
        }

        void StartDining(SimCustomer customer, SimGroup? group)
        {
            double diningTime = stochastic.NextDiningTime();
            double postMealTime = stochastic.NextPostMealTime();
            double totalDiningDuration = diningTime + postMealTime;

            customer.PostMealDurationMinutes = postMealTime;
            double finishTime = clock + totalDiningDuration;

            int tableNum = customer.TableNumber ?? 0;
            int groupSize = group?.Size ?? 1;

            ScheduleEvent(finishTime, EventType.FinConsumo, $"Grupo G{customer.GroupId}",
                $"Termina de consumir y sobremesa en Mesa #{tableNum} ({totalDiningDuration:F2} min).", () =>
                {
                    UpdateChairArea(clock);

                    var table = tables.FirstOrDefault(t => t.TableNumber == tableNum);
                    if (table != null)
                    {
                        table.OccupiedChairs = Math.Max(0, table.OccupiedChairs - groupSize);
                    }

                    customer.TableLeaveMinute = clock;
                    customer.ExitMinute = clock;
                    customer.Status = CustomerStatus.AtendidoEnMesa;

                    // Actualizar compañeros de grupo si los hay
                    if (group != null)
                    {
                        foreach (var companion in group.Customers)
                        {
                            companion.TableLeaveMinute = clock;
                            companion.ExitMinute = clock;
                            if (companion.Status == CustomerStatus.SoloAcompana || companion.Status == CustomerStatus.EsperandoFila)
                            {
                                companion.Status = CustomerStatus.AtendidoEnMesa;
                            }
                        }
                    }

                    LogEvent(EventType.FinConsumo, $"Grupo G{customer.GroupId}",
                        $"Grupo libera Mesa #{tableNum} (Sillas libres ahora: {table?.FreeChairs}). Salen satisfechos de la cafetería.");
                });
        }

        // Programar la llegada de un grupo
        void ScheduleNextGroupArrival()
        {
            double interArrival = stochastic.NextInterArrivalTime(); // Media 2 min
            double arrivalTime = clock + interArrival;

            if (arrivalTime <= horizon)
            {
                ScheduleEvent(arrivalTime, EventType.LlegadaGrupo, "Cafetería",
                    "Llegada de un nuevo grupo de clientes a la cafetería.", () =>
                    {
                        groupIdCounter++;
                        int groupSize = stochastic.NextGroupSize();
                        bool groupIsTakeaway = stochastic.NextIsTakeaway();
                        bool groupWillingToShare = stochastic.NextWillingToShareTable();

                        var simGroup = new SimGroup
                        {
                            GroupId = groupIdCounter,
                            Size = groupSize,
                            ArrivalMinute = clock,
                            IsTakeaway = groupIsTakeaway,
                            WillingToShareTable = groupWillingToShare
                        };

                        LogEvent(EventType.LlegadaGrupo, $"Grupo G{groupIdCounter}",
                            $"Llega grupo #{groupIdCounter} con {groupSize} persona(s). Tipo: {(groupIsTakeaway ? "Para llevar" : "Consumir en mesa")}.");

                        for (int i = 1; i <= groupSize; i++)
                        {
                            bool buys = stochastic.NextBuysFood();
                            bool bringsOwn = !buys && stochastic.NextBringsOwnFood();
                            int items = buys ? stochastic.NextItemsOrderedCount() : 0;
                            double patience = stochastic.NextPatienceTime();
                            double decision = stochastic.NextDecisionTime();

                            var customer = new SimCustomer
                            {
                                GroupId = groupIdCounter,
                                IndexInGroup = i,
                                GroupSize = groupSize,
                                ArrivalMinute = clock,
                                DecisionTimeMinutes = decision,
                                BuysFood = buys,
                                BringsOwnFood = bringsOwn,
                                ItemsOrderedCount = items,
                                IsTakeaway = groupIsTakeaway,
                                PatienceLimitMinutes = patience,
                                WillingToShareTable = groupWillingToShare,
                                Status = buys ? CustomerStatus.EsperandoFila : CustomerStatus.SoloAcompana
                            };

                            simGroup.Customers.Add(customer);
                            allCustomers.Add(customer);

                            if (buys)
                            {
                                // Entra a la fila de caja tras el tiempo de decisión
                                double queueEntryTime = clock + decision;
                                ScheduleEvent(queueEntryTime, EventType.IngresoFilaCaja, $"Cliente G{groupIdCounter}-C{i}",
                                    $"Cliente entra a fila única de caja con {items} ítems. Paciencia: {patience:F2} min.", () =>
                                    {
                                        customer.QueueEntryMinute = clock;
                                        cashierQueue.Enqueue(customer);

                                        if (cashierQueue.Count > maxQueueLength)
                                        {
                                            maxQueueLength = cashierQueue.Count;
                                        }

                                        LogEvent(EventType.IngresoFilaCaja, $"Cliente G{customer.GroupId}-C{customer.IndexInGroup}",
                                            $"En fila de caja. Longitud actual de la fila: {cashierQueue.Count}.");

                                        // Programar posible abandono por paciencia
                                        double patienceExpiry = clock + customer.PatienceLimitMinutes;
                                        ScheduleEvent(patienceExpiry, EventType.AbandonoPaciencia, $"Cliente G{customer.GroupId}-C{customer.IndexInGroup}",
                                            $"Límite de paciencia alcanzado para cliente G{customer.GroupId}-C{customer.IndexInGroup}.", () =>
                                            {
                                                // Si todavía está esperando en la cola sin haber sido atendido
                                                if (customer.Status == CustomerStatus.EsperandoFila && !customer.ServiceStartMinute.HasValue)
                                                {
                                                    customer.Status = CustomerStatus.AbandonoFilaPaciencia;
                                                    customer.HadToLeaveQueueForPatience = true;
                                                    customer.ExitMinute = clock;

                                                    LogEvent(EventType.AbandonoPaciencia, $"Cliente G{customer.GroupId}-C{customer.IndexInGroup}",
                                                        $"Cliente agotó su paciencia ({customer.PatienceLimitMinutes:F2} min) en la fila y se retira.");
                                                }
                                            });

                                        // Verificar si un cajero puede atender inmediatamente
                                        CheckCashierQueue();
                                    });
                            }
                            else
                            {
                                LogEvent(EventType.LlegadaGrupo, $"Cliente G{groupIdCounter}-C{i}",
                                    $"Acompañante (no compra en caja). {(bringsOwn ? "Trae comida propia." : "Solo acompaña.")}");
                            }
                        }

                        allGroups.Add(simGroup);

                        // Programar la siguiente llegada recursivamente mientras clock < horizon
                        if (clock < horizon)
                        {
                            ScheduleNextGroupArrival();
                        }
                    });
            }
        }

        // Programar el cierre del horizonte de simulación (no más llegadas)
        ScheduleEvent(horizon, EventType.CierreLlegadas, "Cafetería",
            $"Se alcanza el horizonte de simulación ({horizon:F0} min). Se cierran las puertas para nuevas llegadas; se atiende a todos los presentes.", () =>
            {
                LogEvent(EventType.CierreLlegadas, "Administración",
                    "Cierre de admisiones de nuevos clientes. El sistema procesará todos los clientes en cola y en servicio hasta vaciarse.");
            });

        // Inicializar la primera llegada de grupo
        ScheduleNextGroupArrival();

        // Bucle principal de Simulación de Eventos Discretos (DES)
        while (eventQueue.Count > 0)
        {
            var nextEvent = eventQueue.Dequeue();
            clock = nextEvent.Time;
            nextEvent.Execute();
        }

        // Finalizar área de sillas
        UpdateChairArea(clock);

        // Si algún cajero quedó ocupado registrando tiempo
        foreach (var c in cashiers)
        {
            if (c.IsBusy)
            {
                c.TotalBusyTimeMinutes += (clock - c.LastServiceStartTime);
                c.IsBusy = false;
            }
        }

        // Crear objeto SimulationRun y consolidar KPIs
        var run = new SimulationRun
        {
            HorizonMinutes = horizon,
            ActualTotalTimeMinutes = Math.Round(clock, 2),
            CashiersCount = parameters.CashiersCount,
            TablesOf4Count = parameters.TablesOf4Count,
            TablesOf2Count = parameters.TablesOf2Count,
            TotalChairsCount = parameters.TotalChairs,
            Description = parameters.Description ?? "Simulación de Cafetería Universitaria",

            TotalGroupsArrived = allGroups.Count,
            TotalCustomersArrived = allCustomers.Count,
            TotalCustomersServed = allCustomers.Count(c => c.Status == CustomerStatus.AtendidoEnMesa || c.Status == CustomerStatus.AtendidoParaLlevar),
            TotalServedDineIn = allCustomers.Count(c => c.Status == CustomerStatus.AtendidoEnMesa),
            TotalServedTakeaway = allCustomers.Count(c => c.Status == CustomerStatus.AtendidoParaLlevar),
            TotalAbandonedQueue = allCustomers.Count(c => c.Status == CustomerStatus.AbandonoFilaPaciencia),
            TotalAbandonedNoTable = allCustomers.Count(c => c.Status == CustomerStatus.AbandonoFaltaSilla),
            TotalCompanionsOnly = allCustomers.Count(c => c.Status == CustomerStatus.SoloAcompana),
            TotalItemsSold = allCustomers.Where(c => c.Status == CustomerStatus.AtendidoEnMesa || c.Status == CustomerStatus.AtendidoParaLlevar).Sum(c => c.ItemsOrderedCount),
            MaxQueueLength = maxQueueLength
        };

        // Métricas de tiempo promedio
        var servedCustomers = allCustomers.Where(c => c.Status == CustomerStatus.AtendidoEnMesa || c.Status == CustomerStatus.AtendidoParaLlevar).ToList();
        var customersWhoQueued = allCustomers.Where(c => c.QueueEntryMinute > 0 && (c.ServiceStartMinute.HasValue || c.HadToLeaveQueueForPatience)).ToList();

        run.AvgQueueWaitTimeMinutes = customersWhoQueued.Any()
            ? Math.Round(customersWhoQueued.Average(c => c.QueueWaitTimeMinutes), 2)
            : 0.0;

        var customersWhoUsedCashier = allCustomers.Where(c => c.ServiceStartMinute.HasValue && c.ServiceEndMinute.HasValue).ToList();
        run.AvgCashierServiceTimeMinutes = customersWhoUsedCashier.Any()
            ? Math.Round(customersWhoUsedCashier.Average(c => c.CashierServiceDurationMinutes), 2)
            : 0.0;

        var preparedOrders = allCustomers.Where(c => c.OrderReadyMinute.HasValue && c.ServiceEndMinute.HasValue).ToList();
        run.AvgKitchenPrepTimeMinutes = preparedOrders.Any()
            ? Math.Round(preparedOrders.Average(c => c.PreparationDurationMinutes), 2)
            : 0.0;

        var dineInCustomers = allCustomers.Where(c => c.Status == CustomerStatus.AtendidoEnMesa && c.TableLeaveMinute.HasValue && c.TableSeatedMinute.HasValue).ToList();
        run.AvgDiningTimeMinutes = dineInCustomers.Any()
            ? Math.Round(dineInCustomers.Average(c => c.DiningDurationMinutes), 2)
            : 0.0;

        run.AvgTotalTimeInSystemMinutes = servedCustomers.Any()
            ? Math.Round(servedCustomers.Average(c => c.TotalTimeInSystemMinutes), 2)
            : 0.0;

        // Métricas de ocupación de cajeros
        double simDuration = clock > 0 ? clock : horizon;
        run.Cashier1UtilizationPercent = Math.Round(Math.Min(100.0, (cashiers[0].TotalBusyTimeMinutes / simDuration) * 100.0), 2);
        run.Cashier2UtilizationPercent = Math.Round(Math.Min(100.0, (cashiers[1].TotalBusyTimeMinutes / simDuration) * 100.0), 2);
        run.OverallCashierUtilizationPercent = Math.Round((run.Cashier1UtilizationPercent + run.Cashier2UtilizationPercent) / 2.0, 2);

        // Métricas de ocupación de sillas
        double totalPossibleChairMinutes = parameters.TotalChairs * simDuration;
        run.AvgTableChairsOccupancyPercent = totalPossibleChairMinutes > 0
            ? Math.Round(Math.Min(100.0, (accumulatedChairMinutes / totalPossibleChairMinutes) * 100.0), 2)
            : 0.0;

        // Armar métricas por mesa y cajero
        var tableMetrics = tables.Select(t =>
        {
            double possibleChairMins = t.Capacity * simDuration;
            double occupancyPct = possibleChairMins > 0 ? (t.TotalChairMinutesUsed / possibleChairMins) * 100.0 : 0.0;
            return new TableOccupancyMetric
            {
                TableNumber = t.TableNumber,
                Capacity = t.Capacity,
                TotalChairMinutesUsed = Math.Round(t.TotalChairMinutesUsed, 2),
                TotalPossibleChairMinutes = Math.Round(possibleChairMins, 2),
                OccupancyPercentage = Math.Round(Math.Min(100.0, occupancyPct), 2),
                TotalGroupsHosted = t.TotalGroupsHosted
            };
        }).ToList();

        var cashierMetrics = cashiers.Select(c => new CashierOccupancyMetric
        {
            CashierId = c.Id,
            BusyTimeMinutes = Math.Round(c.TotalBusyTimeMinutes, 2),
            TotalSimulationMinutes = Math.Round(simDuration, 2),
            UtilizationPercentage = Math.Round(Math.Min(100.0, (c.TotalBusyTimeMinutes / simDuration) * 100.0), 2),
            TotalCustomersServed = c.TotalCustomersServed
        }).ToList();

        // Convertir SimCustomer a SimulationCustomerRecord
        foreach (var c in allCustomers)
        {
            run.CustomerRecords.Add(new SimulationCustomerRecord
            {
                SimulationRunId = run.Id,
                GroupId = c.GroupId,
                GroupSize = c.GroupSize,
                CustomerIndexInGroup = c.IndexInGroup,
                ArrivalMinute = Math.Round(c.ArrivalMinute, 2),
                DecisionTimeMinutes = Math.Round(c.DecisionTimeMinutes, 2),
                QueueEntryMinute = Math.Round(c.QueueEntryMinute, 2),
                ServiceStartMinute = c.ServiceStartMinute.HasValue ? Math.Round(c.ServiceStartMinute.Value, 2) : null,
                ServiceEndMinute = c.ServiceEndMinute.HasValue ? Math.Round(c.ServiceEndMinute.Value, 2) : null,
                OrderReadyMinute = c.OrderReadyMinute.HasValue ? Math.Round(c.OrderReadyMinute.Value, 2) : null,
                TableSeatedMinute = c.TableSeatedMinute.HasValue ? Math.Round(c.TableSeatedMinute.Value, 2) : null,
                TableLeaveMinute = c.TableLeaveMinute.HasValue ? Math.Round(c.TableLeaveMinute.Value, 2) : null,
                ExitMinute = c.ExitMinute.HasValue ? Math.Round(c.ExitMinute.Value, 2) : null,
                QueueWaitTimeMinutes = Math.Round(c.QueueWaitTimeMinutes, 2),
                CashierServiceDurationMinutes = Math.Round(c.CashierServiceDurationMinutes, 2),
                PreparationDurationMinutes = Math.Round(c.PreparationDurationMinutes, 2),
                DiningDurationMinutes = Math.Round(c.DiningDurationMinutes, 2),
                PostMealDurationMinutes = Math.Round(c.PostMealDurationMinutes, 2),
                TotalTimeInSystemMinutes = Math.Round(c.TotalTimeInSystemMinutes, 2),
                CashierId = c.CashierId,
                TableNumber = c.TableNumber,
                TableCapacity = c.TableCapacity,
                SharedTable = c.SharedTable,
                Status = c.Status,
                IsTakeaway = c.IsTakeaway,
                BuysFood = c.BuysFood,
                BringsOwnFood = c.BringsOwnFood,
                ItemsOrderedCount = c.ItemsOrderedCount,
                PatienceLimitMinutes = Math.Round(c.PatienceLimitMinutes, 2),
                WillingToShareTable = c.WillingToShareTable,
                HadToLeaveQueueForPatience = c.HadToLeaveQueueForPatience,
                HadToLeaveForNoTable = c.HadToLeaveForNoTable
            });
        }

        // Asignar los eventos a la corrida
        foreach (var ev in eventsLog)
        {
            ev.SimulationRunId = run.Id;
            run.Events.Add(ev);
        }

        return new SimulationResult
        {
            Run = run,
            Customers = allCustomers,
            EventsLog = eventsLog,
            TableMetrics = tableMetrics,
            CashierMetrics = cashierMetrics
        };
    }
}

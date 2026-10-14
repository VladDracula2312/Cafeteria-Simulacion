-- Script de inicialización de Base de Datos MySQL
-- Proyecto: Simulación Digital - Cafetería Universitaria
-- Docente: Luis Carlos Tovar Garrido
-- Estudiantes: Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz

CREATE DATABASE IF NOT EXISTS CafeteriaSimulacionDb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE CafeteriaSimulacionDb;

CREATE TABLE IF NOT EXISTS SimulationRuns (
    Id CHAR(36) NOT NULL PRIMARY KEY,
    CreatedAt DATETIME(6) NOT NULL,
    HorizonMinutes DOUBLE NOT NULL,
    ActualTotalTimeMinutes DOUBLE NOT NULL,
    CashiersCount INT NOT NULL,
    TablesOf4Count INT NOT NULL,
    TablesOf2Count INT NOT NULL,
    TotalChairsCount INT NOT NULL,
    TotalGroupsArrived INT NOT NULL,
    TotalCustomersArrived INT NOT NULL,
    TotalCustomersServed INT NOT NULL,
    TotalServedDineIn INT NOT NULL,
    TotalServedTakeaway INT NOT NULL,
    TotalAbandonedQueue INT NOT NULL,
    TotalAbandonedNoTable INT NOT NULL,
    TotalCompanionsOnly INT NOT NULL,
    TotalItemsSold INT NOT NULL,
    AvgQueueWaitTimeMinutes DOUBLE NOT NULL,
    AvgCashierServiceTimeMinutes DOUBLE NOT NULL,
    AvgKitchenPrepTimeMinutes DOUBLE NOT NULL,
    AvgDiningTimeMinutes DOUBLE NOT NULL,
    AvgTotalTimeInSystemMinutes DOUBLE NOT NULL,
    Cashier1UtilizationPercent DOUBLE NOT NULL,
    Cashier2UtilizationPercent DOUBLE NOT NULL,
    OverallCashierUtilizationPercent DOUBLE NOT NULL,
    AvgTableChairsOccupancyPercent DOUBLE NOT NULL,
    MaxQueueLength INT NOT NULL,
    DatabaseEngineUsed VARCHAR(50) NOT NULL,
    Description VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS CustomerRecords (
    Id CHAR(36) NOT NULL PRIMARY KEY,
    SimulationRunId CHAR(36) NOT NULL,
    GroupId INT NOT NULL,
    GroupSize INT NOT NULL,
    CustomerIndexInGroup INT NOT NULL,
    ArrivalMinute DOUBLE NOT NULL,
    DecisionTimeMinutes DOUBLE NOT NULL,
    QueueEntryMinute DOUBLE NOT NULL,
    ServiceStartMinute DOUBLE NULL,
    ServiceEndMinute DOUBLE NULL,
    OrderReadyMinute DOUBLE NULL,
    TableSeatedMinute DOUBLE NULL,
    TableLeaveMinute DOUBLE NULL,
    ExitMinute DOUBLE NULL,
    QueueWaitTimeMinutes DOUBLE NOT NULL,
    CashierServiceDurationMinutes DOUBLE NOT NULL,
    PreparationDurationMinutes DOUBLE NOT NULL,
    DiningDurationMinutes DOUBLE NOT NULL,
    PostMealDurationMinutes DOUBLE NOT NULL,
    TotalTimeInSystemMinutes DOUBLE NOT NULL,
    CashierId INT NULL,
    TableNumber INT NULL,
    TableCapacity INT NULL,
    SharedTable BOOLEAN NOT NULL,
    Status INT NOT NULL,
    IsTakeaway BOOLEAN NOT NULL,
    BuysFood BOOLEAN NOT NULL,
    BringsOwnFood BOOLEAN NOT NULL,
    ItemsOrderedCount INT NOT NULL,
    PatienceLimitMinutes DOUBLE NOT NULL,
    WillingToShareTable BOOLEAN NOT NULL,
    HadToLeaveQueueForPatience BOOLEAN NOT NULL,
    HadToLeaveForNoTable BOOLEAN NOT NULL,
    CONSTRAINT FK_CustomerRecords_SimulationRuns_SimulationRunId FOREIGN KEY (SimulationRunId) REFERENCES SimulationRuns(Id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX IX_CustomerRecords_SimulationRunId ON CustomerRecords(SimulationRunId);
CREATE INDEX IX_CustomerRecords_GroupId ON CustomerRecords(GroupId);

CREATE TABLE IF NOT EXISTS SimulationEvents (
    Id CHAR(36) NOT NULL PRIMARY KEY,
    SimulationRunId CHAR(36) NOT NULL,
    TimestampMinute DOUBLE NOT NULL,
    EventType INT NOT NULL,
    Description VARCHAR(255) NOT NULL,
    EntityRef VARCHAR(50) NOT NULL,
    QueueLengthAtEvent INT NOT NULL,
    FreeChairsAtEvent INT NOT NULL,
    BusyCashiersAtEvent INT NOT NULL,
    CONSTRAINT FK_SimulationEvents_SimulationRuns_SimulationRunId FOREIGN KEY (SimulationRunId) REFERENCES SimulationRuns(Id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE INDEX IX_SimulationEvents_SimulationRunId ON SimulationEvents(SimulationRunId);
CREATE INDEX IX_SimulationEvents_TimestampMinute ON SimulationEvents(TimestampMinute);

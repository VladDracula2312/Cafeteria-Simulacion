namespace CafeteriaSimulacion.Api.Domain.Enums;

public enum CustomerStatus
{
    EsperandoFila = 0,
    AtendidoEnMesa = 1,
    AtendidoParaLlevar = 2,
    AbandonoFilaPaciencia = 3,
    AbandonoFaltaSilla = 4,
    SoloAcompana = 5
}

public enum EventType
{
    LlegadaGrupo = 1,
    IngresoFilaCaja = 2,
    InicioAtencionCaja = 3,
    FinAtencionCaja = 4,
    InicioPreparacion = 5,
    EntregaPedido = 6,
    AsignacionMesa = 7,
    FinConsumo = 8,
    SalidaCafeteria = 9,
    AbandonoPaciencia = 10,
    AbandonoSinSilla = 11,
    CierreLlegadas = 12
}

public enum TableType
{
    Mesa2Personas = 2,
    Mesa4Personas = 4
}

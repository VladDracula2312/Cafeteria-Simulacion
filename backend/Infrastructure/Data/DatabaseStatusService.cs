namespace CafeteriaSimulacion.Api.Infrastructure.Data;

public interface IDatabaseStatusService
{
    string ActiveEngine { get; }
    bool IsFallbackInMemory { get; }
    string? FailureReason { get; }
    void SetStatus(string engine, bool isFallback, string? reason = null);
}

public class DatabaseStatusService : IDatabaseStatusService
{
    public string ActiveEngine { get; private set; } = "Unknown";
    public bool IsFallbackInMemory { get; private set; } = false;
    public string? FailureReason { get; private set; } = null;

    public void SetStatus(string engine, bool isFallback, string? reason = null)
    {
        ActiveEngine = engine;
        IsFallbackInMemory = isFallback;
        FailureReason = reason;
    }
}

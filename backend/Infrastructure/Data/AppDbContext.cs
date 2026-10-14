using CafeteriaSimulacion.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace CafeteriaSimulacion.Api.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<SimulationRun> SimulationRuns => Set<SimulationRun>();
    public DbSet<SimulationCustomerRecord> CustomerRecords => Set<SimulationCustomerRecord>();
    public DbSet<SimulationEvent> SimulationEvents => Set<SimulationEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // SimulationRun
        modelBuilder.Entity<SimulationRun>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasMany(e => e.CustomerRecords)
                  .WithOne(c => c.SimulationRun)
                  .HasForeignKey(c => c.SimulationRunId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasMany(e => e.Events)
                  .WithOne(ev => ev.SimulationRun)
                  .HasForeignKey(ev => ev.SimulationRunId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // SimulationCustomerRecord
        modelBuilder.Entity<SimulationCustomerRecord>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SimulationRunId);
            entity.HasIndex(e => e.GroupId);
        });

        // SimulationEvent
        modelBuilder.Entity<SimulationEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.SimulationRunId);
            entity.HasIndex(e => e.TimestampMinute);
        });
    }
}

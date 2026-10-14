using CafeteriaSimulacion.Api.Simulation.Stochastic;
using Xunit;

namespace CafeteriaSimulacion.Tests;

public class StochasticGeneratorTests
{
    [Fact]
    public void Poisson_Lambda2_ReturnsValidMean()
    {
        var gen = new StochasticGenerator(seed: 42);
        int samples = 5000;
        double sum = 0;

        for (int i = 0; i < samples; i++)
        {
            sum += gen.NextPoisson(2.0);
        }

        double mean = sum / samples;
        Assert.InRange(mean, 1.85, 2.15); // Media teórica: 2.0
    }

    [Fact]
    public void Poisson_Knuth_Lambda30_ReturnsValidMean()
    {
        var gen = new StochasticGenerator(seed: 42);
        int samples = 5000;
        double sum = 0;

        for (int i = 0; i < samples; i++)
        {
            sum += gen.NextPoisson(30.0);
        }

        double mean = sum / samples;
        Assert.InRange(mean, 28.5, 31.5); // Media teórica: 30.0
    }

    [Fact]
    public void Exponential_Mean2_ReturnsValidMean()
    {
        var gen = new StochasticGenerator(seed: 123);
        int samples = 10000;
        double sum = 0;

        for (int i = 0; i < samples; i++)
        {
            sum += gen.NextInterArrivalTime(); // Media 2 min
        }

        double mean = sum / samples;
        Assert.InRange(mean, 1.88, 2.12);
    }

    [Fact]
    public void Uniform_RangesAreStrictlyRespected()
    {
        var gen = new StochasticGenerator(seed: 999);
        for (int i = 0; i < 1000; i++)
        {
            double dec = gen.NextDecisionTime();
            Assert.InRange(dec, 0.0, 5.0);

            double postMeal = gen.NextPostMealTime();
            Assert.InRange(postMeal, 0.0, 15.0);

            double patience = gen.NextPatienceTime();
            Assert.InRange(patience, 0.0, 20.0);
        }
    }

    [Fact]
    public void Empirical_GroupSize_FrequenciesMatchDistribution()
    {
        var gen = new StochasticGenerator(seed: 555);
        int samples = 10000;
        int count1 = 0, count2 = 0, count3 = 0, count4 = 0;

        for (int i = 0; i < samples; i++)
        {
            int size = gen.NextGroupSize();
            Assert.InRange(size, 1, 4);

            if (size == 1) count1++;
            else if (size == 2) count2++;
            else if (size == 3) count3++;
            else if (size == 4) count4++;
        }

        // 1: 40%, 2: 35%, 3: 15%, 4: 10%
        Assert.InRange((double)count1 / samples, 0.38, 0.42);
        Assert.InRange((double)count2 / samples, 0.33, 0.37);
        Assert.InRange((double)count3 / samples, 0.13, 0.17);
        Assert.InRange((double)count4 / samples, 0.08, 0.12);
    }

    [Fact]
    public void Triangular_RangesAndBoundsAreRespected()
    {
        var gen = new StochasticGenerator(seed: 777);
        for (int i = 0; i < 1000; i++)
        {
            // Triangular(0.5, 2, 4)
            double cashier = gen.NextCashierServiceTime();
            Assert.InRange(cashier, 0.5, 4.0);

            // Triangular(1, 2.5, 6)
            double prep = gen.NextPreparationTime();
            Assert.InRange(prep, 1.0, 6.0);

            // Triangular(5, 15, 30)
            double dining = gen.NextDiningTime();
            Assert.InRange(dining, 5.0, 30.0);
        }
    }

    [Fact]
    public void Bernoulli_ProbabilitiesAreRespected()
    {
        var gen = new StochasticGenerator(seed: 888);
        int samples = 10000;
        int takeaway = 0, buys = 0, leaves = 0, shares = 0;

        for (int i = 0; i < samples; i++)
        {
            if (gen.NextIsTakeaway()) takeaway++;
            if (gen.NextBuysFood()) buys++;
            if (gen.NextLeavesIfNoTable()) leaves++;
            if (gen.NextWillingToShareTable()) shares++;
        }

        Assert.InRange((double)takeaway / samples, 0.38, 0.42); // 40%
        Assert.InRange((double)buys / samples, 0.83, 0.87);     // 85%
        Assert.InRange((double)leaves / samples, 0.18, 0.22);   // 20%
        Assert.InRange((double)shares / samples, 0.48, 0.52);   // 50%
    }
}

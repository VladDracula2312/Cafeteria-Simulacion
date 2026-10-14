namespace CafeteriaSimulacion.Api.Simulation.Stochastic;

public interface IStochasticGenerator
{
    int NextPoisson(double lambda);
    double NextExponential(double mean);
    double NextUniform(double min, double max);
    int NextGroupSize();
    bool NextBernoulli(double probability);
    double NextTriangular(double min, double mode, double max);
    bool NextBringsOwnFood();
    
    // Métodos de conveniencia con los parámetros de la especificación
    double NextInterArrivalTime(); // Exponencial(media = 2 min)
    double NextDecisionTime();     // Uniforme(0, 5)
    double NextPostMealTime();     // Uniforme(0, 15)
    double NextPatienceTime();     // Uniforme(0, 20)
    double NextCashierServiceTime(); // Triangular(0.5, 2, 4)
    double NextPreparationTime();    // Triangular(1, 2.5, 6)
    double NextDiningTime();         // Triangular(5, 15, 30)
    int NextItemsOrderedCount();     // Poisson(lambda = 2)
    bool NextIsTakeaway();           // Bernoulli(0.4)
    bool NextBuysFood();             // Bernoulli(0.85)
    bool NextLeavesIfNoTable();      // Bernoulli(0.2)
    bool NextWillingToShareTable();  // Bernoulli(0.5)
}

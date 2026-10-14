namespace CafeteriaSimulacion.Api.Simulation.Stochastic;

public class StochasticGenerator : IStochasticGenerator
{
    private readonly Random _random;

    public StochasticGenerator(int? seed = null)
    {
        _random = seed.HasValue ? new Random(seed.Value) : new Random();
    }

    private double NextDouble()
    {
        // Evitamos 0.0 exacto para operaciones logarítmicas seguras (1 - U > 0)
        double u = _random.NextDouble();
        return u <= 0.0 ? 1e-10 : (u >= 1.0 ? 1.0 - 1e-10 : u);
    }

    /// <summary>
    /// Generación Poisson usando el algoritmo clásico de Knuth.
    /// Para valores moderados a altos de lambda, usa acumulación logarítmica sum(-ln(U)) > lambda
    /// para evitar underflow numérico y asegurar precisión matemática idéntica.
    /// </summary>
    public int NextPoisson(double lambda)
    {
        if (lambda <= 0) return 0;

        if (lambda < 30.0)
        {
            double l = Math.Exp(-lambda);
            double p = 1.0;
            int k = 0;
            do
            {
                k++;
                p *= NextDouble();
            } while (p > l);

            return k - 1;
        }
        else
        {
            // Knuth en espacio logarítmico: sum(-ln(u)) > lambda
            int k = 0;
            double sum = 0.0;
            while (true)
            {
                double u = NextDouble();
                sum += -Math.Log(u);
                if (sum > lambda)
                {
                    return k;
                }
                k++;
            }
        }
    }

    /// <summary>
    /// Distribución Exponencial por Transformada Inversa: T = -media * ln(1 - U)
    /// </summary>
    public double NextExponential(double mean)
    {
        if (mean <= 0) return 0;
        double u = NextDouble();
        return -mean * Math.Log(1.0 - u);
    }

    /// <summary>
    /// Distribución Uniforme continua en el intervalo [min, max]
    /// </summary>
    public double NextUniform(double min, double max)
    {
        if (min >= max) return min;
        return min + (max - min) * NextDouble();
    }

    /// <summary>
    /// Distribución Empírica para tamaño del grupo:
    /// 1 persona: 40% (0.00 - 0.40)
    /// 2 personas: 35% (0.40 - 0.75)
    /// 3 personas: 15% (0.75 - 0.90)
    /// 4 personas: 10% (0.90 - 1.00)
    /// </summary>
    public int NextGroupSize()
    {
        double u = NextDouble();
        if (u < 0.40) return 1;
        if (u < 0.75) return 2;
        if (u < 0.90) return 3;
        return 4;
    }

    /// <summary>
    /// Ensayo de Bernoulli con probabilidad p de éxito (retorna true con prob p)
    /// </summary>
    public bool NextBernoulli(double probability)
    {
        if (probability <= 0) return false;
        if (probability >= 1.0) return true;
        return NextDouble() < probability;
    }

    /// <summary>
    /// Distribución Triangular(a, c, b) donde a = min, c = moda, b = max
    /// Implementada mediante transformada inversa exacta.
    /// </summary>
    public double NextTriangular(double min, double mode, double max)
    {
        if (min >= max) return min;
        if (mode < min) mode = min;
        if (mode > max) mode = max;

        double u = NextDouble();
        double fc = (mode - min) / (max - min);

        if (u < fc)
        {
            return min + Math.Sqrt(u * (max - min) * (mode - min));
        }
        else
        {
            return max - Math.Sqrt((1.0 - u) * (max - min) * (max - mode));
        }
    }

    /// <summary>
    /// Empírica llevar comida propia: Sí: 50%, No: 50%
    /// </summary>
    public bool NextBringsOwnFood()
    {
        return NextBernoulli(0.50);
    }

    // Métodos específicos con los parámetros del caso de estudio
    public double NextInterArrivalTime() => NextExponential(2.0); // Media 2 min (lambda = 30 llegadas/hora)
    public double NextDecisionTime() => NextUniform(0.0, 5.0);    // U(0, 5) min antes de pedir
    public double NextPostMealTime() => NextUniform(0.0, 15.0);   // U(0, 15) min sobremesa
    public double NextPatienceTime() => NextUniform(0.0, 20.0);   // U(0, 20) min paciencia en fila
    public double NextCashierServiceTime() => NextTriangular(0.5, 2.0, 4.0); // Triangular(0.5, 2, 4)
    public double NextPreparationTime() => NextTriangular(1.0, 2.5, 6.0);    // Triangular(1, 2.5, 6)
    public double NextDiningTime() => NextTriangular(5.0, 15.0, 30.0);       // Triangular(5, 15, 30)
    public int NextItemsOrderedCount() => Math.Max(1, NextPoisson(2.0));     // Poisson(lambda=2), al menos 1 si compra
    public bool NextIsTakeaway() => NextBernoulli(0.40);                     // Bernoulli(p = 0.4)
    public bool NextBuysFood() => NextBernoulli(0.85);                       // Bernoulli(p = 0.85)
    public bool NextLeavesIfNoTable() => NextBernoulli(0.20);                // Bernoulli(p = 0.2)
    public bool NextWillingToShareTable() => NextBernoulli(0.50);            // Bernoulli(p = 0.5)
}

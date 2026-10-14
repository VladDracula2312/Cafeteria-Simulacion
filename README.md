# Simulación Digital - Cafetería Universitaria
## Temática: Carnaval de Barranquilla (Folclor Caribeño)

**Asignatura:** Simulación Digital  
**Docente:** Luis Carlos Tovar Garrido  
**Estudiantes:** Pedro Eli Diaz Olarte & Vlad Esteban Preciado Ruiz  

---

## 1. Descripción del Proyecto
Este proyecto es una aplicación web interactiva que simula de forma estocástica y discreta (Discrete-Event Simulation - DES) la operación de la cafetería universitaria durante un horizonte de tiempo de **$X$ minutos** (base 60 minutos).

La interfaz cuenta con un diseño inspirado en el **Carnaval de Barranquilla**, utilizando una paleta folclórica vibrante (Rojo Garabato, Amarillo Cumbia, Azul Marimonda, Verde Joselito y Dorado) con motivos geométricos y culturales vectoriales (SVG y Lucide Icons), **sin el uso de emojis**.

---

## 2. Parámetros del Modelo de Simulación

### Variables No Aleatorias
* **Horizonte:** Configurable por el usuario/profesor ($X$ minutos, base 60 min).
* **Capacidad de Mesas y Sillas (100 sillas en total):**
  * 20 mesas de 4 personas (80 puestos).
  * 10 mesas de 2 personas (20 puestos).
* **Servidores en Caja:** 2 cajeros en paralelo.
* **Cola de Espera:** Cola única centralizada con disciplina FIFO y capacidad infinita.
* **Políticas de Asientos:** Primer asiento disponible; grupos juntos prioritariamente; posibilidad de compartir mesa; probabilidad de abandono por falta de puesto.
* **Política de Cierre:** No entran más grupos luego de transcurrido el horizonte $X$. Se atienden todos los clientes que se encuentren dentro de la cafetería o en cola.

### Variables Aleatorias y Distribuciones
1. **Llegadas por hora:** Distribución Poisson ($\lambda = 30/\text{h}$).
2. **Tiempo entre llegadas:** Distribución Exponencial ($\mu = 2\text{ min}$).
3. **Hora de llegada dentro de la hora:** Uniforme $(0, 60)\text{ min}$.
4. **Tamaño del grupo:** Distribución Empírica Discreta:
   * 1 persona: 40%
   * 2 personas: 35%
   * 3 personas: 15%
   * 4 personas: 10%
5. **¿Para llevar?:** Bernoulli ($p = 0.40$).
6. **¿Compra algo?:** Bernoulli ($p = 0.85$).
7. **Número de ítems comprados:** Poisson ($\lambda = 2$).
8. **Tiempo antes de pedir:** Uniforme $(0, 5)\text{ min}$.
9. **Tiempo de atención en caja:** Triangular $(0.5, 2.0, 4.0)\text{ min}$.
10. **Tiempo de preparación/entrega:** Triangular $(1.0, 2.5, 6.0)\text{ min}$.
11. **Tiempo comiendo/consumiendo:** Triangular $(5.0, 15.0, 30.0)\text{ min}$.
12. **Tiempo después de comer:** Uniforme $(0, 15)\text{ min}$.
13. **Paciencia en fila:** Uniforme $(0, 20)\text{ min}$ (abandono si la espera supera la paciencia).
14. **Probabilidad de irse si no hay silla:** Bernoulli ($p = 0.20$).
15. **Probabilidad de compartir mesa:** Bernoulli ($p = 0.50$).
16. **Llevarse la comida post-entrega:** Empírica (Sí: 50%, No: 50%).
17. **Tiempo de limpieza de mesa:** Uniforme $(1.0, 2.0)\text{ min}$.

---

## 3. Arquitectura Tecnológica
* **Frontend:** React + Vite + TypeScript + Tailwind CSS + Lucide Icons.
* **Backend:** C# .NET 8 ASP.NET Core Web API + Motor DES propio.
* **Base de Datos:** MySQL 8.0 con Entity Framework Core (Pomelo Provider) y fallback automático a memoria para pruebas sin caída.
* **Generación de Reportes Excel:** ClosedXML (.xlsx enriquecido con múltiples hojas de cálculo, KPIs e histórico).

---

## 4. Instrucciones de Ejecución

### Opción A: Ejecución con Docker Compose (Recomendada)
Para levantar la base de datos MySQL y el Backend con un solo comando:
```bash
docker compose up -d
```
Luego iniciar el frontend:
```bash
cd frontend
npm install
npm run dev
```

### Opción B: Ejecución Manual Local

#### 1. Backend (.NET 8)
```bash
cd backend
dotnet restore
dotnet run
```
La API estará disponible en `http://localhost:5000` con Swagger en `http://localhost:5000/swagger`.

#### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
```
La aplicación abrirá en `http://localhost:5173`.


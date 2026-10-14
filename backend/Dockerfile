# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["CafeteriaSimulacion.Api.csproj", "./"]
RUN dotnet restore "./CafeteriaSimulacion.Api.csproj"

COPY . .
RUN dotnet publish "./CafeteriaSimulacion.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "CafeteriaSimulacion.Api.dll"]

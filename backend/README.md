# Backend (.NET Web API)

```
Kantor.slnx            solution (format SLNX)
src/Kantor.Api/        ASP.NET Core Web API
```

```bash
cd backend
dotnet build Kantor.slnx
dotnet run --project src/Kantor.Api   # http://localhost:5171/health
```

OpenAPI (Development): `http://localhost:5171/openapi/v1.json`.

Nowe projekty (np. testy z `task_020`) dodajemy do `src/` lub `tests/` i rejestrujemy: `dotnet sln Kantor.slnx add <ścieżka.csproj>`.

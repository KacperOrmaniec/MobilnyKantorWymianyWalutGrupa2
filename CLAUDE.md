# CLAUDE.md

Mobile currency-exchange system (university group project, Polish). Spec: [requirements.md](requirements.md). Setup and API reference: [README.md](README.md), [backend/README.md](backend/README.md). Task list: `.backlog/tasks.yaml` (readable copy: [docs/BACKLOG.md](docs/BACKLOG.md)).

## Stack

- **backend/** — ASP.NET Core Web API, .NET 10, EF Core + Npgsql. Solution `backend/Kantor.slnx`, project `src/Kantor.Api`. Runs on `http://localhost:5171`.
- **Database** — PostgreSQL 17 in Docker (`docker-compose.yml`, plus pgAdmin on `127.0.0.1:5050`). Schema in `backend/database/schema.sql`, applied on **every** container start by `start-db.sh`.
- **mobile/** — Expo 57 + expo-router (file-based routes in `mobile/src/app/`), TypeScript strict, React 19 / RN 0.86, `@/*` → `mobile/src/*`. Android is the target platform.
- **External** — NBP API (`https://api.nbp.pl/api/`): table C (bid/ask) for current rates, table A (mid) for historical.

## Commands

```bash
docker compose up -d db pgadmin                        # dev: DB only, API from VS (needs .env from .env.example)
docker compose up -d --build                           # everything incl. API in Docker on :5171 (needs JWT_KEY in .env)
cd backend && dotnet build Kantor.slnx
dotnet run --project backend/src/Kantor.Api            # API; OpenAPI at /openapi/v1.json in Development
dotnet run --project backend/src/Kantor.Api --launch-profile http-siec   # API on 0.0.0.0:5171 (phone/emulator)
cd backend && dotnet test Kantor.slnx                  # tests; DB tests skipped unless KANTOR_TEST_DB is set
cd mobile && npm install && npx expo start             # mobile app
backlog task list | backlog serve --no-open            # tasks (on Windows `backlog board` crashes)
```

Tests: `backend/tests/Kantor.Api.Tests` (xUnit). `KwotaValidator` unit tests always run. Procedure tests (`ProceduryTests`, Npgsql, each test in a rolled-back transaction) need `KANTOR_TEST_DB` (Npgsql connection string to a DB with `schema.sql` applied), otherwise they are skipped via `[BazaFact]`. New .NET projects go into `src/` or `tests/` and are added with `dotnet sln Kantor.slnx add <csproj>`.

## Architecture and conventions

- **Database First.** `Data/KantorDbContext.cs` and `Models/` are generated with EF reverse engineering from the Postgres schema. Change `schema.sql` first, then regenerate or update the models to match. Do not add EF migrations.
- **Schema script is idempotent**: `CREATE TABLE IF NOT EXISTS` plus `CREATE OR REPLACE PROCEDURE`. It **never adds columns to existing tables**, so a column change needs a manual `ALTER` or a dropped volume (`docker compose down -v`).
- **Money logic lives in DB procedures**: `przelew`, `przewalutowanie`, `zmiana_aktualnego_kursu_walut`. They lock rows with `FOR UPDATE` and are atomic. The PLN amount is rounded in the DB (`ROUND(..., 2)`). Controllers call the procedures and do not change balances themselves. The mobile app must never compute or modify balances (this is a requirement).
- **Exchange semantics** (from the user's perspective): `ZAKUP` = the user buys foreign currency for PLN at the exchange office's `kurs_sprzedazy`. `SPRZEDAZ` = the user sells foreign currency for PLN at `kurs_zakupu`. `kwota` is always the EUR/USD amount. Before each exchange the backend refreshes NBP rates and aborts if that fails. The rate used is stored with the transaction.
- **Currencies are data, not code**: table `waluty` (PLN, EUR, USD, CHF, GBP) drives validation, NBP refresh and `/saldo`. Adding one = one `INSERT` in `schema.sql` (must exist in NBP table C). Balances live in `salda (id_konta, waluta, saldo)`; a missing row means 0, rows are created on first credit (`INSERT ... ON CONFLICT ON CONSTRAINT salda_pkey DO UPDATE`). Debits are `UPDATE ... WHERE saldo >= kwota` + `IF NOT FOUND`.
- **PL/pgSQL gotcha**: procedure params `waluta` / `id_konta` clash with `salda` columns. Alias the table (`AS s`) and qualify params (`przewalutowanie.id_konta`), or Postgres raises "column reference is ambiguous".
- **Controllers**: `[ApiController]` + `ControllerBase` with primary constructors (`(KantorDbContext db, NbpService nbp)`). Errors are returned as `{ error = "..." }` with Polish messages. Status mapping: validation / `P0001` → 400, missing account → 404, `23505` → 409, other `PostgresException` → 500 `"Błąd bazy danych."`, NBP failure → 502, NBP timeout → 504. Amount validation goes through `Validation/KwotaValidator` (positive, at most 2 decimal places).
- **Naming**: Polish domain names everywhere (code, routes, DB, comments): `konta`, `kursy`, `przelewy`, `saldo`, `doladowanie`, `przewalutowanie`. Keep it that way. Comments are short Polish one-liners above methods.
- Passwords are hashed with ASP.NET Core Identity `PasswordHasher<Konto>`.

## Secrets

- DB credentials go in `.env` (gitignored) for Docker and in **User Secrets** (`ConnectionStrings:KantorDb`) for the API. Never put them in `appsettings*.json`.
- Requirement: no plaintext credentials in the DB or the repo.

## Current state / known gaps (as of 2026-10-14)

- **No auth yet**: there is no JWT and no login endpoint, and accounts are addressed by `{id}` in the URL (task_012/013 are open). Requirements need registration + login + authorization.
- `schema.sql` seeds users `test` / `test2` with **plaintext** password `test123`. These won't verify against `PasswordHasher` and they violate the no-plaintext requirement.
- `backend/README.md` mentions `/health`, but the actual health endpoints are `GET /test` and `GET /testdb` (`StatusController`). CORS is not configured.
- Mobile is template + tab layout only (`index`, `profile`, `exchange` screens WIP). There is no API client yet. `app.json` references `./assets/...` images, but `mobile/assets/` is not in the repo.
- Backlog statuses in `.backlog/tasks.yaml` lag behind the code: most backend tasks still show `backlog` even though they are implemented.
- Postman collections are in `postman/`.
- Compose services have no `container_name` (containers are `<project>-db-1` etc.), so several stacks can run with `-p <name>`. The `api` container runs in Production (no OpenAPI) and listens on 8080 → host `${API_PORT:-5171}`. The compose file requires `JWT_KEY` in `.env` even when only `db` is started.
- `GET /kursy/historyczne` re-fetches the whole requested range from NBP on every call (no "only missing days" logic yet).

## Workflow

- Commit `.backlog/` changes together with the code they track.
- `graphify-out/` contains a knowledge graph of the repo. Use `/graphify` queries for architecture questions.

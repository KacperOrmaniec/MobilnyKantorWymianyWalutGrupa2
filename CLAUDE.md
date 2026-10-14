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

Tests: `backend/tests/Kantor.Api.Tests` (xUnit). `KwotaValidator` unit tests always run. DB tests (`ProceduryTests` for procedures, `AlertyTests` for alert triggers; Npgsql, each test in a rolled-back transaction) need `KANTOR_TEST_DB` (Npgsql connection string to a DB with `schema.sql` applied), otherwise they are skipped via `[BazaFact]`. New .NET projects go into `src/` or `tests/` and are added with `dotnet sln Kantor.slnx add <csproj>`.

## Architecture and conventions

- **Database First.** `Data/KantorDbContext.cs` and `Models/` are generated with EF reverse engineering from the Postgres schema. Change `schema.sql` first, then regenerate or update the models to match. Do not add EF migrations.
- **Schema script is idempotent**: `CREATE TABLE IF NOT EXISTS` plus `CREATE OR REPLACE PROCEDURE`. It **never adds columns to existing tables**, so a column change needs a manual `ALTER` or a dropped volume (`docker compose down -v`).
- **Money logic lives in DB procedures**: `przelew`, `przewalutowanie`, `doladowanie`, `zmiana_aktualnego_kursu_walut`. They lock rows with `FOR UPDATE` and are atomic. The PLN amount is rounded in the DB (`ROUND(..., 2)`). Controllers call the procedures and do not change balances themselves. The mobile app must never compute or modify balances (this is a requirement).
- **Exchange semantics** (from the user's perspective): `ZAKUP` = the user buys foreign currency for PLN at the exchange office's `kurs_sprzedazy`. `SPRZEDAZ` = the user sells foreign currency for PLN at `kurs_zakupu`. `kwota` is always the foreign-currency amount. Before each exchange the backend refreshes NBP rates and aborts if that fails. The rate used is stored with the transaction.
- **Rate alerts** (`alerty_kursowe`, `AlertyController`, `/konta/me/alerty`): fulfilment is set by DB triggers, not C#: `sprawdz_alerty_kursowe` (AFTER INSERT OR UPDATE on `aktualne_kursy_walut`) and `sprawdz_nowy_alert` (BEFORE INSERT on `alerty_kursowe`). `ZAKUP` fires when `kurs_sprzedazy <= prog`, `SPRZEDAZ` when `kurs_zakupu >= prog`; one-shot. Triggers are idempotent via `CREATE OR REPLACE FUNCTION` + `DROP TRIGGER IF EXISTS`.
- **Currencies are data, not code**: table `waluty` (PLN, EUR, USD, CHF, GBP) drives validation, NBP refresh and `/saldo`. Adding one = one `INSERT` in `schema.sql` (must exist in NBP table C). Balances live in `salda (id_konta, waluta, saldo)`; a missing row means 0, rows are created on first credit (`INSERT ... ON CONFLICT ON CONSTRAINT salda_pkey DO UPDATE`). Debits are `UPDATE ... WHERE saldo >= kwota` + `IF NOT FOUND`.
- **PL/pgSQL gotcha**: procedure params `waluta` / `id_konta` clash with `salda` columns. Alias the table (`AS s`) and qualify params (`przewalutowanie.id_konta`), or Postgres raises "column reference is ambiguous".
- **Controllers**: `[ApiController]` + `ControllerBase` with primary constructors (`(KantorDbContext db, NbpService nbp)`). Errors are returned as `{ error = "..." }` with Polish messages. Exceptions are mapped in one place (`UseExceptionHandler` + `MapujBlad` in `Program.cs`): `P0001` → 400 with the procedure message, other DB errors → 500 `"Błąd bazy danych."`, NBP failure → 502, NBP timeout → 504, anything else → 500 `"Wewnętrzny błąd serwera."`, so controllers do not catch these. Controllers only return validation 400, missing account 404 and `23505` → 409 themselves. Invalid JSON / model binding → 400 `{ error }` (`InvalidModelStateResponseFactory`), JwtBearer 401 → `{ error }` (`OnChallenge`). Amount validation goes through `Validation/KwotaValidator` (positive, at most 2 decimal places).
- **Naming**: Polish domain names everywhere (code, routes, DB, comments): `konta`, `kursy`, `przelewy`, `saldo`, `doladowanie`, `przewalutowanie`. Keep it that way. Comments are short Polish one-liners above methods.
- Passwords are hashed with ASP.NET Core Identity `PasswordHasher<Konto>`.

## Secrets

- DB credentials go in `.env` (gitignored) for Docker and in **User Secrets** (`ConnectionStrings:KantorDb`, `Jwt:Key`) for the API. Never put them in `appsettings*.json`.
- Requirement: no plaintext credentials in the DB or the repo.

## Current state / known gaps (as of 2026-10-14)

Backend, DB and Docker are done: B01–B12 and B14–B18 in [docs/BACKLOG_BACKEND.md](docs/BACKLOG_BACKEND.md); only B13 (ERD diagram, manual in pgAdmin) is left. `tasks.yaml` statuses are up to date.

**Done**
- Auth: `POST /auth/register`, `POST /auth/login` → JWT (`sub` = account id, 60 min, HMAC-SHA256, key `Jwt:Key` in User Secrets / `Jwt__Key` env, min. 32 chars or the API won't start). `[Authorize]` on `KontaController`, `TransakcjeController`, `PrzelewyController`, `AlertyController`; the account id always comes from the token via `User.IdKonta()` (`Controllers/AuthController.cs`), routes are `/konta/me/...`. Transfers take `loginOdbiorcy`. Public: `/auth/*`, `/kursy*`, `/test`, `/testdb`.
- Seed users `test` / `test2` (password `test123`) are stored as an Identity hash; `schema.sql` also rewrites old plaintext rows. Top-ups go through procedure `doladowanie` and are logged in `historia_doladowan`. `GET /konta/me/transakcje` returns the combined history.
- Rates: `Services/OdswiezanieKursow.cs` (hosted service) refreshes table C at startup and every `Kursy:OdswiezanieMinuty` (default 15). `GET /kursy` reads only from the DB (calls NBP only if the table is empty or `?odswiez=true`). Exchange still refreshes from NBP first and fails on NBP errors. NBP base URL: `Nbp:Adres`. `GET /kursy/historyczne?waluta=&od=&do=` (table A, max 93 days, default last 7 days).
- Health endpoints are `GET /test` and `GET /testdb` (`StatusController`). CORS is not configured (not needed for the native app).
- Compose services have no `container_name` (containers are `<project>-db-1` etc.), so several stacks can run with `-p <name>`. The `api` container runs in Production (no OpenAPI) and listens on 8080 → host `${API_PORT:-5171}`. `JWT_KEY` is optional for compose itself (`db` starts without it); the `api` container refuses to start without a 32+ char key.
- Postman collections are in `postman/` (`konta`, `kursy`, `przelewy`, NBP).

**Gaps**
- Mobile is template + tab layout only (`index`, `profile`, `exchange` screens WIP). There is no API client yet. `app.json` references `./assets/...` images, but `mobile/assets/` is not in the repo.
- No ERD in `docs/diagrams/` yet (B13; how-to in BACKLOG_BACKEND.md). Other stage-1 diagrams and the report are open.
- `/konta/me/transakcje` merges three queries in memory (no paging). `/kursy/historyczne` re-fetches the whole requested range from NBP on every call (no "only missing days" logic).

## Workflow

- Commit `.backlog/` changes together with the code they track.
- `graphify-out/` contains a knowledge graph of the repo. Use `/graphify` queries for architecture questions.

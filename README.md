# MobilnyKantorWymianyWalutGrupa2

System mobilny kantoru wymiany walut (projekt zaliczeniowy). Wymagania: [requirements.md](requirements.md).

## Stack

| Warstwa | Technologia |
|---|---|
| Aplikacja mobilna | **React Native + Expo** (TypeScript), Android |
| Backend | **.NET Web API** (ASP.NET Core, EF Core) |
| Baza danych | **PostgreSQL**, uruchamiany w **Dockerze** |
| Kursy walut | publiczne API NBP (`api.nbp.pl`) |
| Zadania | **backlog** CLI (`.backlog/`) |

## Wymagane narzędzia

Każdy w zespole potrzebuje:

| Narzędzie | Po co | Instalacja |
|---|---|---|
| **Git** | repozytorium | https://git-scm.com |
| **Docker Desktop** | baza PostgreSQL (`docker compose`) | https://www.docker.com/products/docker-desktop |
| **.NET SDK** (aktualny LTS) | backend | https://dotnet.microsoft.com/download |
| **Node.js** (aktualny LTS) | aplikacja mobilna (Expo), backlog CLI | https://nodejs.org |
| **Expo Go** na telefonie z Androidem *lub* emulator z Android Studio | uruchamianie aplikacji | Sklep Play / https://developer.android.com/studio |
| **backlog** CLI | tablica zadań | `npm install -g backlog` |

PostgreSQL nie trzeba instalować osobno, bo działa w kontenerze. Do podglądu bazy wystarczy dowolny klient, np. DBeaver albo pgAdmin.

Szybkie sprawdzenie, czy wszystko jest zainstalowane:

```bash
git --version
docker --version
dotnet --version
node --version
backlog --version
```

## Struktura repo

```
backend/        .NET Web API
mobile/         aplikacja React Native (Expo)
docs/           dokumentacja, backlog, raport
docs/diagrams/  pliki źródłowe diagramów (UML, ERD)
.backlog/       zadania (backlog CLI)
```

## Szybki start: baza danych (Docker + PostgreSQL)

```bash
cp .env.example .env     # uzupełnij POSTGRES_PASSWORD
docker compose up -d db  # start bazy
docker compose ps        # status (db powinno być "healthy")
docker compose down      # zatrzymanie (dane zostają w wolumenie db-data)
```

Postgres będzie dostępny na `localhost:5432`, login i hasło są w `.env`. Plik `.env` nie trafia do repo.

## Backlog

Zadania są w `.backlog/tasks.yaml` i zarządza nimi CLI `backlog`. Czytelna kopia jest w [docs/BACKLOG.md](docs/BACKLOG.md).

```bash
backlog task list                  # lista zadań
backlog task show task_001         # szczegóły i kryteria akceptacji
backlog task move task_001 in_progress
backlog serve --no-open            # tablica kanban: http://127.0.0.1:7878
```

Na Windowsie `backlog board` się wywraca przy próbie otwarcia przeglądarki (`spawn start ENOENT`), dlatego używamy `backlog serve --no-open` i otwieramy adres ręcznie.

Zmiany w `.backlog/` commitujemy razem z kodem.

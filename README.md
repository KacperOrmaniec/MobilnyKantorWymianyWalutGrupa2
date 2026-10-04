# MobilnyKantorWymianyWalutGrupa2

System mobilny kantoru wymiany walut (projekt zaliczeniowy). Wymagania: [requirements.md](requirements.md).

## Stack

- **Mobile:** React Native + Expo (Android)
- **Backend:** .NET Web API
- **Baza danych:** PostgreSQL (Docker)
- **Kursy walut:** API NBP

## Struktura repo

```
backend/        .NET Web API
mobile/         aplikacja React Native (Expo)
docs/           dokumentacja, backlog, raport
docs/diagrams/  pliki źródłowe diagramów (UML, ERD)
.backlog/       zadania (backlog CLI)
```

## Szybki start: baza danych

```bash
cp .env.example .env     # uzupełnij POSTGRES_PASSWORD
docker compose up -d db
```

Postgres będzie dostępny na `localhost:5432` (dane z `.env`).

## Backlog

Zadania są w `.backlog/` (backlog CLI: `backlog board`). Czytelna wersja jest w [docs/BACKLOG.md](docs/BACKLOG.md).

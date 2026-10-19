# Backlog

Źródło prawdy to `.backlog/tasks.yaml` (backlog CLI). Ten plik to czytelna kopia do przeglądu w zespole.
Priorytety: **P0** = konieczne do zaliczenia, **P1** = ważne, **P2** = jakość, **P3** = extra (10% oceny).
Status jak w `backlog task list`: ✅ `done`, `ready`, `backlog`. Szczegóły backendu: [BACKLOG_BACKEND.md](BACKLOG_BACKEND.md).

**Postęp (2026-10-14):** 14/37 zrobione. Backend, baza i Docker gotowe. Zostały: dokumentacja etapu 1 (diagramy, raport), cała aplikacja mobilna, testy E2E, prezentacja.

## Proponowany podział (po warstwach)

| Osoba | Obszar | Zadania |
|---|---|---|
| A | Backend: auth, portfel, transakcje | 008, 012, 013, 016, 017, 018, 019 |
| B | Backend: baza, NBP, testy, devops | 009, 011, 014, 015, 020, 021 |
| C | Mobile | 010, 022, 023, 025, 026, 027 |
| D | Dokumentacja/diagramy, potem mobile | 002–007, 024, 028, 029, 031–033 |

Etap 1 (001–006) robicie wspólnie, a D składa raport. Decyzja 001 blokuje 014 i 018.

## Etap 1: projekt koncepcyjny

| ID | P | Status | Zadanie |
|---|---|---|---|
| 001 | P0 | ✅ done | Decyzja: polityka kursów NBP przy kupnie/sprzedaży ([POLITYKA_KURSOW.md](POLITYKA_KURSOW.md)) |
| 002 | P0 | backlog | Wymagania funkcjonalne i niefunkcjonalne |
| 003 | P0 | backlog | Diagram przypadków użycia UML |
| 004 | P0 | backlog | Diagram klas |
| 005 | P0 | backlog | Model bazy danych i diagram ERD (model jest w `schema.sql`, brakuje diagramu, B13) |
| 006 | P0 | backlog | Opis architektury i komunikacji między komponentami |
| 007 | P1 | backlog | Raport PDF z etapu 1 |

## Setup

| ID | P | Status | Zadanie |
|---|---|---|---|
| 008 | P0 | ✅ done | Szkielet backendu .NET Web API (OpenAPI, `/test`, `/testdb`; bez Swagger UI i CORS) |
| 009 | P0 | ✅ done | EF Core + PostgreSQL (Database First, `schema.sql` zamiast migracji) |
| 010 | P0 | backlog | Szkielet aplikacji mobilnej (Expo, TypeScript, nawigacja, klient API) |
| 011 | P1 | ✅ done | Zarządzanie sekretami i konfiguracją (.env, user-secrets) |

## Backend

| ID | P | Status | Zadanie |
|---|---|---|---|
| 012 | P0 | ✅ done | Rejestracja i logowanie (hash hasła, JWT) |
| 013 | P1 | ✅ done | Autoryzacja endpointów, walidacja, obsługa błędów |
| 014 | P0 | ✅ done | Integracja z API NBP: kursy aktualne |
| 015 | P1 | ✅ done | Kursy archiwalne |
| 016 | P0 | ✅ done | Zasilenie konta symulowanym przelewem |
| 017 | P0 | ✅ done | Portfel: stan sald |
| 018 | P0 | ✅ done | Transakcja kupna/sprzedaży waluty (atomowo, kurs zapisany w transakcji) |
| 019 | P1 | ✅ done | Historia transakcji (bez paginacji) |
| 020 | P1 | ✅ done | Testy backendu |
| 021 | P2 | ✅ done | Dockerfile dla API + API w docker-compose |

## Mobile

| ID | P | Status | Zadanie |
|---|---|---|---|
| 022 | P0 | backlog | Ekrany rejestracji i logowania (token w SecureStore) |
| 023 | P0 | backlog | Ekran aktualnych kursów |
| 024 | P1 | ready | Ekran kursów archiwalnych |
| 025 | P0 | backlog | Ekran zasilenia konta |
| 026 | P0 | backlog | Ekran kupna/sprzedaży waluty |
| 027 | P0 | backlog | Ekran portfela |
| 028 | P1 | backlog | Ekran historii transakcji |
| 029 | P2 | backlog | UX: stany ładowania, błędy, puste stany |

## Etap 2: testy, dokumentacja, oddanie

| ID | P | Status | Zadanie |
|---|---|---|---|
| 030 | P1 | backlog | Testy scenariuszy end-to-end |
| 031 | P1 | backlog | Instrukcja uruchomienia systemu (część backendowa jest w README) |
| 032 | P2 | backlog | Dokumentacja użytkownika |
| 033 | P1 | backlog | Prezentacja i scenariusz demo |

## Extra (do oceny 5,0)

| ID | P | Status | Zadanie |
|---|---|---|---|
| 034 | P3 | backlog | Wykres kursu archiwalnego (backend gotowy: `/kursy/historyczne`) |
| 035 | P3 | backlog | Alerty kursowe (backend gotowy: `/konta/me/alerty`, brak ekranu) |
| 036 | P3 | backlog | Obsługa wielu języków (PL/EN) |
| 037 | P3 | backlog | Tryb offline dla kursów (backend gotowy: `/kursy` z bazy, brak cache w mobile) |

Więcej walut (PLN, EUR, USD, CHF, GBP) jest zrobione po stronie backendu, ale nie ma osobnego zadania w `tasks.yaml` (B16).

Pełne opisy i kryteria akceptacji: `backlog task show task_0XX`.

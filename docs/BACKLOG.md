# Backlog (draft)

Źródło prawdy to `.backlog/tasks.yaml` (backlog CLI). Ten plik to czytelna kopia do przeglądu w zespole.
Priorytety: **P0** = konieczne do zaliczenia, **P1** = ważne, **P2** = jakość, **P3** = extra (10% oceny).

## Proponowany podział (po warstwach)

| Osoba | Obszar | Zadania |
|---|---|---|
| A | Backend: auth, portfel, transakcje | 008, 012, 013, 016, 017, 018, 019 |
| B | Backend: baza, NBP, testy, devops | 009, 011, 014, 015, 020, 021 |
| C | Mobile | 010, 022, 023, 025, 026, 027 |
| D | Dokumentacja/diagramy, potem mobile | 002–007, 024, 028, 029, 031–033 |

Etap 1 (001–006) robicie wspólnie, a D składa raport. Decyzja 001 blokuje 014 i 018.

## Etap 1: projekt koncepcyjny

| ID | P | Zadanie |
|---|---|---|
| 001 | P0 | Decyzja: polityka kursów NBP przy kupnie/sprzedaży (tabela A/C, bid/ask, brak kursu) |
| 002 | P0 | Wymagania funkcjonalne i niefunkcjonalne |
| 003 | P0 | Diagram przypadków użycia UML |
| 004 | P0 | Diagram klas |
| 005 | P0 | Model bazy danych i diagram ERD |
| 006 | P0 | Opis architektury i komunikacji między komponentami |
| 007 | P1 | Raport PDF z etapu 1 |

## Setup

| ID | P | Zadanie |
|---|---|---|
| 008 | P0 | Szkielet backendu .NET Web API (Swagger, /health, CORS) |
| 009 | P0 | EF Core + PostgreSQL + migracje |
| 010 | P0 | Szkielet aplikacji mobilnej (Expo, TypeScript, nawigacja, klient API) |
| 011 | P1 | Zarządzanie sekretami i konfiguracją (.env, user-secrets) |

## Backend

| ID | P | Zadanie |
|---|---|---|
| 012 | P0 | Rejestracja i logowanie (hash hasła, JWT) |
| 013 | P1 | Autoryzacja endpointów, walidacja, obsługa błędów |
| 014 | P0 | Integracja z API NBP: kursy aktualne |
| 015 | P1 | Kursy archiwalne |
| 016 | P0 | Zasilenie konta symulowanym przelewem |
| 017 | P0 | Portfel: stan sald |
| 018 | P0 | Transakcja kupna/sprzedaży waluty (atomowo, kurs zapisany w transakcji) |
| 019 | P1 | Historia transakcji |
| 020 | P1 | Testy backendu |
| 021 | P2 | Dockerfile dla API + API w docker-compose |

## Mobile

| ID | P | Zadanie |
|---|---|---|
| 022 | P0 | Ekrany rejestracji i logowania (token w SecureStore) |
| 023 | P0 | Ekran aktualnych kursów |
| 024 | P1 | Ekran kursów archiwalnych |
| 025 | P0 | Ekran zasilenia konta |
| 026 | P0 | Ekran kupna/sprzedaży waluty |
| 027 | P0 | Ekran portfela |
| 028 | P1 | Ekran historii transakcji |
| 029 | P2 | UX: stany ładowania, błędy, puste stany |

## Etap 2: testy, dokumentacja, oddanie

| ID | P | Zadanie |
|---|---|---|
| 030 | P1 | Testy scenariuszy end-to-end |
| 031 | P1 | Instrukcja uruchomienia systemu |
| 032 | P2 | Dokumentacja użytkownika |
| 033 | P1 | Prezentacja i scenariusz demo |

## Extra (do oceny 5,0)

| ID | P | Zadanie |
|---|---|---|
| 034 | P3 | Wykres kursu archiwalnego |
| 035 | P3 | Alerty kursowe |
| 036 | P3 | Obsługa wielu języków (PL/EN) |
| 037 | P3 | Tryb offline dla kursów |

Pełne opisy i kryteria akceptacji: `backlog task show task_0XX`.

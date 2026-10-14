# Backend (.NET Web API)

```
Kantor.slnx            solution (format SLNX)
src/Kantor.Api/        ASP.NET Core Web API
  Controllers/        endpointy pogrupowane w kontrolerach
  Data/               kontekst bazy danych
  Models/             modele bazy i dane żądań
  Validation/         walidacja kwot
  Services/           pobieranie i zapis kursów NBP
```

API korzysta z kontrolerów z `[ApiController]` i `ControllerBase`.
`Program.cs` konfiguruje aplikację i rejestruje kontrolery przez `AddControllers()` oraz `MapControllers()`.
Adresy endpointów i dane żądań pozostają takie same.

```bash
cd backend
dotnet build Kantor.slnx
dotnet run --project src/Kantor.Api   # http://localhost:5171/test
```

OpenAPI (Development): `http://localhost:5171/openapi/v1.json`.

## Endpointy

Endpointy można testować w Postmanie. Konfiguracja bazy i User Secrets jest opisana w głównym [README](../README.md).

| Metoda | Adres | Działanie |
|---|---|---|
| POST | `/auth/register` | Rejestracja: `login`, `haslo`, `imie`, `nazwisko`; zwraca `201`. Publiczny. |
| POST | `/auth/login` | Logowanie: `login`, `haslo`; zwraca `{ token, wygasa }` (JWT ważny 60 min). Publiczny. |
| GET | `/konta/me` | Profil: `{ id, login, imie, nazwisko, salda }` (salda w formacie jak `/konta/me/saldo`). |
| GET | `/konta/me/saldo` | Salda we wszystkich walutach: `{ id, salda: [{ waluta, nazwa, saldo }] }`, PLN pierwszy, brak środków = `0`. |
| POST | `/konta/me/doladowanie` | Procedura `doladowanie`: dodaje `kwota` do salda PLN i zapisuje wpis w `historia_doladowan`. |
| GET | `/konta/me/historia-przelewow` | Przelewy wysłane i odebrane, od najnowszych, z polami `nazwaNadawcy` i `nazwaOdbiorcy` (imię i nazwisko). |
| GET | `/konta/me/historia-przewalutowania` | Przewalutowania, od najnowszych. |
| GET | `/konta/me/transakcje` | Wspólna historia (przelewy, przewalutowania, doładowania), od najnowszych. Pola: `id`, `rodzaj`, `walutaZrodlowa`, `walutaDocelowa`, `kwota`, `kwotaDocelowa`, `kurs`, `data`, `kontrahent`. |
| GET | `/kursy` | Odświeża wszystkie waluty z `waluty` z tabeli C NBP i zwraca aktualne kursy z bazy. |
| GET | `/kursy/historyczne?waluta=&od=&do=` | Kursy średnie z tabeli A NBP dla zakresu dat, rosnąco po dacie (pod wykres). Parametry opcjonalne. |
| POST | `/przelewy` | Procedura `przelew`: nadawca z tokena, `loginOdbiorcy`, `kwota`, `waluta` (dowolna z tabeli `waluty`). Nieznany odbiorca → `404`, przelew do siebie → `400`. |
| POST | `/konta/me/przewalutowanie` | Procedura `przewalutowanie`: `waluta` (z tabeli `waluty`, bez PLN), `kwota`, `typTransakcji`. |
| POST | `/konta/me/alerty` | Alert kursowy: `waluta` (bez PLN), `typ` (`ZAKUP`/`SPRZEDAZ`), `prog` (> 0, max 6 miejsc po przecinku); `201` z alertem. Max 20 niespełnionych alertów na konto (`400`). |
| GET | `/konta/me/alerty` | Alerty od najnowszych: `{ id, waluta, typ, prog, utworzono, spelniono, kursSpelnienia, aktualnyKurs }`. |
| DELETE | `/konta/me/alerty/{id}` | Usuwa własny alert: `204`; cudzy lub nieistniejący → `404`. |

Kwoty muszą być dodatnie i mieć najwyżej dwa miejsca po przecinku.
Przy przewalutowaniu `kwota` zawsze oznacza ilość waluty obcej. Typ transakcji jest z perspektywy użytkownika: `ZAKUP` oznacza zakup waluty za PLN po `kurs_sprzedazy` kantoru, a `SPRZEDAZ` oznacza sprzedaż waluty i otrzymanie PLN po `kurs_zakupu` kantoru.
Przed każdym przewalutowaniem backend automatycznie pobiera i zapisuje najnowsze kursy wszystkich walut z NBP, a następnie wywołuje procedurę wymiany. Jeśli pobranie kursów się nie uda, przewalutowanie nie zostanie wykonane. Nie trzeba wcześniej wywoływać `/kursy`.
W odpowiedzi `/kursy` pola `kursZakupuPrzezKantor` i `kursSprzedazyPrzezKantor` oznaczają odpowiednio kurs, po którym kantor kupuje walutę od użytkownika, i kurs, po którym sprzedaje ją użytkownikowi.

`/kursy/historyczne` przyjmuje opcjonalne parametry: `waluta` (kod z tabeli `waluty`, bez PLN; brak = wszystkie waluty), `od` i `do` (format `RRRR-MM-DD`). Bez dat zwraca ostatnie 7 dni (dziś minus 6 dni do dziś, według czasu w Polsce); samo `od` oznacza zakres do dziś, samo `do` — 7 dni kończące się tą datą. Walidacja (`400` z `{ error }`): poprawny format dat, `od <= do`, zakres najwyżej 93 dni (limit NBP), `do` nie w przyszłości, obsługiwana waluta. Przykład: `GET /kursy/historyczne?waluta=EUR&od=2026-09-01&do=2026-10-14`.
Endpoint pobiera z NBP cały żądany zakres, zapisuje `mid` w `kurs_avg`, a datę publikacji w `data` (zapis według waluty i daty nie tworzy duplikatów), po czym zwraca z bazy tylko żądaną walutę i zakres, posortowane rosnąco po dacie, a w obrębie dnia po walucie. Dni bez notowań (weekendy, święta) nie są sztucznie uzupełniane; zakres bez notowań daje pustą listę.
Błąd pobierania z NBP zwraca `502`, przekroczenie czasu oczekiwania — `504`, a obsługiwany błąd PostgreSQL — `500` z komunikatem `Błąd bazy danych.`.

Błędy walidacji i komunikaty procedur (`P0001`) zwracają `400`, nieistniejące konto przy odczycie lub doładowaniu — `404`, zajęty login (`23505`) — `409` z komunikatem `Ten login jest już zajęty.`, a utworzenie konta — `201`.
Pozostałe błędy PostgreSQL obsługiwane przy dodawaniu konta, doładowaniu, przelewie i przewalutowaniu zwracają `500` z komunikatem `Błąd bazy danych.`.
Alerty kursowe: typ jak przy przewalutowaniu. `ZAKUP` jest spełniony, gdy `kurs_sprzedazy <= prog`, a `SPRZEDAZ`, gdy `kurs_zakupu >= prog`. Spełnienie ustawia trigger w bazie przy każdej zmianie `aktualne_kursy_walut` (`/kursy`, przewalutowanie, odświeżanie w tle), a jeśli warunek jest spełniony już przy tworzeniu, alert od razu ma `spelniono`. Alert spełnia się tylko raz. `aktualnyKurs` to bieżący kurs odpowiedni dla typu (`null`, gdy kursu jeszcze nie pobrano).
W `/transakcje` pole `rodzaj` to `PRZELEW_WYCHODZACY`, `PRZELEW_PRZYCHODZACY`, `ZAKUP`, `SPRZEDAZ` albo `DOLADOWANIE`. `kwota` to kwota w `walutaZrodlowa`, a `kwotaDocelowa` (tylko wymiany) to kwota w `walutaDocelowa`. `kurs` jest `null` poza wymianami, `kontrahent` (imię i nazwisko drugiej strony) tylko przy przelewach. `id` jest unikalne w obrębie rodzaju.

Hasło nowego użytkownika jest zapisywane jako hash ASP.NET Core Identity i nie jest zwracane w odpowiedziach.
Uwierzytelnianie: JWT (HMAC-SHA256) podpisany kluczem `Jwt:Key` (User Secrets lub zmienna `Jwt__Key`, min. 32 znaki; bez niego API nie startuje). Token ma claim `sub` = id konta i `unique_name` = login.
`/konta/*` i `/przelewy` wymagają nagłówka `Authorization: Bearer <token>` (bez niego `401`); konto jest zawsze brane z tokena, nie z adresu. Publiczne są `/auth/*`, `/kursy*`, `/test` i `/testdb`.
Rejestracja: login 3–100 znaków `[a-zA-Z0-9._-]`, hasło min. 8 znaków, imię i nazwisko niepuste do 100 znaków, spacje obcinane; błędy → `400`. Zły login lub hasło przy logowaniu → ten sam `401` `Nieprawidłowy login lub hasło.`.

## Testy

```
tests/Kantor.Api.Tests/   xUnit
  KwotaValidatorTests.cs  walidacja kwot (przypadki brzegowe)
  ProceduryTests.cs       procedury przelew i przewalutowanie na prawdziwej bazie
  AlertyTests.cs          triggery alertów kursowych na prawdziwej bazie
```

```bash
cd backend
dotnet test Kantor.slnx
KANTOR_TEST_DB="Host=localhost;Port=5432;Database=kantor;Username=kantor;Password=..." dotnet test Kantor.slnx
```

Bez zmiennej `KANTOR_TEST_DB` testy procedur są pomijane (Skip). Baza musi mieć wykonany `schema.sql` (np. kontener `db` z `docker compose`). Każdy test tworzy własne konta (unikalne loginy) w transakcji wycofywanej na końcu, więc baza zostaje bez zmian.
Scenariusze: udany przelew zmienia oba salda i zapisuje historię; brak środków kończy się błędem `P0001` bez zmian sald; `ZAKUP` i `SPRZEDAZ` przy kursie ustawionym przez `zmiana_aktualnego_kursu_walut` dają poprawne, zaokrąglone kwoty i zapisują kurs w historii; nieobsługiwana waluta (lub PLN) przy przewalutowaniu daje `P0001`.

Nowe projekty dodajemy do `src/` lub `tests/` i rejestrujemy: `dotnet sln Kantor.slnx add <ścieżka.csproj>`.

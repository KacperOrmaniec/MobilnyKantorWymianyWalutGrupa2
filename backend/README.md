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
dotnet run --project src/Kantor.Api   # http://localhost:5171/health
```

OpenAPI (Development): `http://localhost:5171/openapi/v1.json`.

## Endpointy

Endpointy można testować w Postmanie. Konfiguracja bazy i User Secrets jest opisana w głównym [README](../README.md).

| Metoda | Adres | Działanie |
|---|---|---|
| GET | `/konta/{id}/saldo` | Salda we wszystkich walutach: `{ id, salda: [{ waluta, nazwa, saldo }] }`, PLN pierwszy, brak środków = `0`. |
| POST | `/konta` | Dodanie użytkownika z zerowymi saldami: `login`, `haslo`, `imie`, `nazwisko`. |
| POST | `/konta/{id}/doladowanie` | Procedura `doladowanie`: dodaje `kwota` do salda PLN i zapisuje wpis w `historia_doladowan`. |
| GET | `/konta/{id}/historia-przelewow` | Przelewy wysłane i odebrane, od najnowszych, z polami `nazwaNadawcy` i `nazwaOdbiorcy` (imię i nazwisko). |
| GET | `/konta/{id}/historia-przewalutowania` | Przewalutowania, od najnowszych. |
| GET | `/konta/{id}/transakcje` | Wspólna historia (przelewy, przewalutowania, doładowania), od najnowszych. Pola: `id`, `rodzaj`, `walutaZrodlowa`, `walutaDocelowa`, `kwota`, `kwotaDocelowa`, `kurs`, `data`, `kontrahent`. |
| GET | `/kursy` | Odświeża wszystkie waluty z `waluty` z tabeli C NBP i zwraca aktualne kursy z bazy. |
| GET | `/kursy/historyczne` | Uzupełnia ostatnie 7 dni z tabeli A NBP i zwraca całą historię z bazy. |
| POST | `/przelewy` | Procedura `przelew`: `idNadawcy`, `idOdbiorcy`, `kwota`, `waluta` (dowolna z tabeli `waluty`). |
| POST | `/konta/{id}/przewalutowanie` | Procedura `przewalutowanie`: `waluta` (z tabeli `waluty`, bez PLN), `kwota`, `typTransakcji`. |

Kwoty muszą być dodatnie i mieć najwyżej dwa miejsca po przecinku.
Przy przewalutowaniu `kwota` zawsze oznacza ilość waluty obcej. Typ transakcji jest z perspektywy użytkownika: `ZAKUP` oznacza zakup waluty za PLN po `kurs_sprzedazy` kantoru, a `SPRZEDAZ` oznacza sprzedaż waluty i otrzymanie PLN po `kurs_zakupu` kantoru.
Przed każdym przewalutowaniem backend automatycznie pobiera i zapisuje najnowsze kursy wszystkich walut z NBP, a następnie wywołuje procedurę wymiany. Jeśli pobranie kursów się nie uda, przewalutowanie nie zostanie wykonane. Nie trzeba wcześniej wywoływać `/kursy`.
W odpowiedzi `/kursy` pola `kursZakupuPrzezKantor` i `kursSprzedazyPrzezKantor` oznaczają odpowiednio kurs, po którym kantor kupuje walutę od użytkownika, i kurs, po którym sprzedaje ją użytkownikowi.

`/kursy/historyczne` pobiera kursy średnie od dziś minus 6 dni do dziś (według czasu w Polsce). Zapisuje `mid` w `kurs_avg`, a datę publikacji w `data`. Zapis według waluty i daty nie tworzy duplikatów; starsze wpisy zostają w bazie i są również zwracane. Dni bez notowań nie są sztucznie uzupełniane.
Błąd pobierania z NBP zwraca `502`, przekroczenie czasu oczekiwania — `504`, a obsługiwany błąd PostgreSQL — `500` z komunikatem `Błąd bazy danych.`.

Błędy walidacji i komunikaty procedur (`P0001`) zwracają `400`, nieistniejące konto przy odczycie lub doładowaniu — `404`, zajęty login (`23505`) — `409` z komunikatem `Ten login jest już zajęty.`, a utworzenie konta — `201`.
Pozostałe błędy PostgreSQL obsługiwane przy dodawaniu konta, doładowaniu, przelewie i przewalutowaniu zwracają `500` z komunikatem `Błąd bazy danych.`.
W `/transakcje` pole `rodzaj` to `PRZELEW_WYCHODZACY`, `PRZELEW_PRZYCHODZACY`, `ZAKUP`, `SPRZEDAZ` albo `DOLADOWANIE`. `kwota` to kwota w `walutaZrodlowa`, a `kwotaDocelowa` (tylko wymiany) to kwota w `walutaDocelowa`. `kurs` jest `null` poza wymianami, `kontrahent` (imię i nazwisko drugiej strony) tylko przy przelewach. `id` jest unikalne w obrębie rodzaju.

Hasło nowego użytkownika jest zapisywane jako hash ASP.NET Core Identity i nie jest zwracane w odpowiedziach.
Endpointy na tym etapie nie mają uwierzytelniania: konto wskazuje się przez ID.

Nowe projekty (np. testy z `task_020`) dodajemy do `src/` lub `tests/` i rejestrujemy: `dotnet sln Kantor.slnx add <ścieżka.csproj>`.

# Backlog: Backend + Baza + Docker

Stan na 2026-10-14. Zakres: `backend/`, `backend/database/`, `docker-compose.yml`.
Priorytety: **P0** = bez tego nie ma zaliczenia, **P1** = ważne dla oceny, **P2** = jakość, **P3** = extra (10%).
W nawiasie odpowiednik w `.backlog/tasks.yaml`, jeśli istnieje.

## Co już jest zrobione

| Wymaganie | Stan |
|---|---|
| Logika kantoru po stronie serwera | ✅ procedury `przelew`, `przewalutowanie` |
| Integracja z NBP (aktualne) | ✅ tabela C, bid/ask, odświeżane przy `/kursy` i przed każdą wymianą |
| Kursy archiwalne | ⚠️ tylko ostatnie 7 dni, bez parametrów |
| Spójność wymiany i sald | ✅ `FOR UPDATE` i jedna transakcja w procedurze |
| Kurs zapisany w transakcji | ✅ `historia_przewalutowania.Kurs_przewalutowania` |
| Rejestracja | ✅ `POST /konta`, hasło jako hash Identity |
| Logowanie, uwierzytelnianie, autoryzacja | ❌ brak |
| Rejestrowanie wszystkich transakcji | ⚠️ doładowanie konta nie trafia do żadnej historii |
| Brak haseł jawnych w bazie | ❌ seed w `schema.sql` ma `test123` jawnym tekstem |
| Walidacja danych | ✅ kwoty i waluty; ⚠️ brak reguł dla hasła i loginu |
| Docker | ⚠️ tylko baza i pgAdmin, API nie jest w compose |
| Testy | ❌ brak |

---

## P0: konieczne do zaliczenia

### B01. Logowanie i JWT (task_012)
- `POST /auth/login` (`login`, `haslo`) weryfikuje hasło przez `PasswordHasher<Konto>.VerifyHashedPassword` i zwraca JWT z `sub` = id konta, ważny np. 60 min.
- Rejestrację przenieść lub zdublować jako `POST /auth/register`; `POST /konta` może zostać.
- Klucz JWT w User Secrets (`Jwt:Key`) i w `.env` dla Dockera, **nie** w `appsettings.json`.
- Paczka: `Microsoft.AspNetCore.Authentication.JwtBearer`.
- **AC:** dobre dane dają `200` i token, złe dają `401` z tym samym komunikatem dla złego loginu i złego hasła.

### B02. Autoryzacja endpointów (task_013)
- `[Authorize]` na wszystkich endpointach konta, przelewów i wymiany. `/kursy` i `/auth/*` zostają publiczne.
- Id konta brać z tokena, nie z URL: `/konta/{id}/saldo` → `/konta/me/saldo`, a `idNadawcy` w przelewie znika z body.
- **AC:** bez tokena jest `401`. Użytkownik A nie może odczytać ani zmienić danych B.

### B03. Usunąć jawne hasła z seeda
- Seed `test`/`test2` w `schema.sql` ma hasło `test123` jawnym tekstem, co łamie wymaganie z pkt 7. Do tego te konta i tak nie zalogują się przez `PasswordHasher`.
- Opcje: wstawić gotowy hash Identity, wygenerowany raz, albo seedować konta z backendu przy starcie w Development.
- **AC:** `SELECT haslo FROM konta` nie zwraca nigdzie jawnego tekstu. `test`/`test123` loguje się przez `/auth/login`.

### B04. Historia doładowań
- `POST /konta/{id}/doladowanie` zmienia saldo bez żadnego śladu. Wymaganie mówi o „rejestrowaniu wykonanych transakcji”.
- Nowa tabela `historia_doladowan` (id, id_konta, kwota, `Timestamp`) i procedura `doladowanie`, która zmienia saldo i zapisuje historię atomowo, tak jak pozostałe.
- **AC:** każde doładowanie ma wpis w historii. Błąd zapisu historii wycofuje zmianę salda.

### B05. API dostępne z telefonu lub emulatora
- API słucha tylko na `localhost:5171`, więc telefon z Expo Go się do niego nie dostanie.
- Dodać profil w `launchSettings.json` z `http://0.0.0.0:5171`. Opisać w README, że emulator Androida używa `10.0.2.2`, a telefon IP komputera w tej samej sieci Wi-Fi.
- **AC:** zespół mobile woła `GET /test` z telefonu i dostaje `200`.

### B06. Spisana polityka kursów (task_001)
- Kod już działa wg tej polityki, brakuje opisu do raportu: tabela C, `ZAKUP` po `ask`, `SPRZEDAZ` po `bid`, PLN jako waluta rozliczeniowa. Kurs jest odświeżany przed każdą wymianą, a gdy NBP nie odpowiada, wymiana nie jest wykonywana (`502`/`504`). W weekend NBP zwraca ostatnią opublikowaną tabelę.
- **AC:** sekcja w `docs/` gotowa do wklejenia do raportu. Task_001 zamknięty.

---

## P1: ważne dla oceny

### B07. Wspólna historia transakcji (task_019)
- `GET /konta/me/transakcje` zwraca przelewy, wymiany i doładowania w jednej liście, posortowane po dacie.
- Każdy wpis zawiera to, czego wymaga pkt 4: rodzaj operacji, walutę źródłową, walutę docelową, kwotę, kurs i datę.
- Rodzaj wymiany (`ZAKUP`/`SPRZEDAZ`) da się wyliczyć z `Waluta_sprzedana = 'PLN'`. Opcjonalnie dodać kolumnę `typ`.
- **AC:** ekran historii w mobile potrzebuje jednego wywołania.

### B08. Kursy archiwalne z parametrami (task_015)
- `GET /kursy/historyczne?waluta=EUR&od=2026-09-01&do=2026-10-14`. NBP pozwala na max 93 dni na zapytanie.
- Brakujące dni pobierać z NBP, już zapisane czytać z bazy.
- **AC:** walidacja zakresu (`od <= do`, ≤ 93 dni, nie w przyszłości). Dane nadają się pod wykres (B15).

### B09. Walidacja rejestracji
- Minimalna długość hasła (np. 8), dozwolone znaki loginu, przycinanie spacji.
- **AC:** słabe hasło daje `400` z czytelnym komunikatem.

### B10. Endpoint profilu
- `GET /konta/me` zwraca id, login, imię, nazwisko i salda. Pod ekran `profile` w mobile.

### B11. Dockerfile API i serwis `api` w compose (task_021)
- Wieloetapowy `Dockerfile` (sdk → aspnet) w `backend/`.
- Serwis `api` z `depends_on: db: condition: service_healthy` i portem `5171`.
- Connection string i klucz JWT podawane przez zmienne `ConnectionStrings__KantorDb` oraz `Jwt__Key` z `.env`.
- **AC:** `docker compose up -d` stawia bazę i API, `GET /testdb` zwraca `connected: true`.

### B12. Testy backendu (task_020)
- Projekt `backend/tests/Kantor.Api.Tests` (xUnit), dodany do `Kantor.slnx`.
- Minimum: `KwotaValidator`, logowanie, a procedury `przewalutowanie` i `przelew` sprawdzone na prawdziwej bazie z Dockera (brak salda, zły kurs, wycofanie zmian).
- **AC:** `dotnet test` przechodzi lokalnie. Scenariusze opisane do raportu („przetestowanie podstawowych scenariuszy”).

### B13. Diagram ERD z `schema.sql`
- Diagram ERD jest wymagany w etapie 1, a my znamy bazę najlepiej. Wygenerować go z pgAdmina (ERD Tool) lub DBeavera i zapisać w `docs/diagrams/`.

---

## P2: jakość

### B14. Jedno miejsce obsługi błędów
- Bloki `catch` na `HttpRequestException`, `PostgresException` i `502`/`504` powtarzają się w każdym kontrolerze. Zastąpić je jednym `IExceptionHandler` lub `UseExceptionHandler`, co odchudzi kontrolery.
- Komunikaty z procedur są bez polskich znaków (`Niewystarczajace saldo`). Poprawić, skoro trafiają prosto do użytkownika.

### B15. Porządki
- `backend/README.md` wspomina `/health`, a endpointy to `/test` i `/testdb`. Ujednolicić nazwę, np. `GET /health`.
- Dodać `CHECK` na `Waluta_sprzedana` i `Waluta_kupiona` w `historia_przewalutowania`.
- Zaktualizować statusy w `.backlog/tasks.yaml`: 008, 009, 014, 016, 017 i 018 są praktycznie zrobione.

---

## P3: extra (10% oceny)

### ✅ B16. Więcej walut: zrobione (gałąź `feature/salda-tabela`), patrz niżej

### B17. Alerty kursowe
- Tabela `alerty` (id_konta, waluta, próg, kierunek). `BackgroundService` sprawdza kursy co X minut, a mobile dostaje listę alertów, które się spełniły.

### B18. Odświeżanie kursów w tle
- `BackgroundService` co np. 15 min, a `GET /kursy` czyta tylko z bazy. Gdy NBP leży, mobile i tak dostaje ostatni kurs z datą aktualizacji (tryb „offline” dla kursów).

---

## Decyzja: więcej walut („przekopiować kod i dodać 2”) ✅ zrealizowane

> Zrobione: tabele `waluty` i `salda`, waluty PLN, EUR, USD, CHF, GBP. Nowa waluta = `INSERT` w `schema.sql`.
> Każdy w zespole musi raz zrobić `docker compose down -v`. `/saldo` zwraca teraz `{ id, salda: [{ waluta, nazwa, saldo }] }`.
> Poniżej zostawiona pierwotna analiza.

Da się, ale przekopiowanie oznacza zmiany w **ok. 8 miejscach**, bo waluty są zaszyte jako kolumny:
`konta.Aktualne_Saldo_XXX`, `CHECK` w `historia_przelewów`, `CASE` w obu procedurach (5 miejsc), `NbpService.Waluty`, walidacje w 2 kontrolerach, model `Konto`, a do tego zapytanie o saldo.
Dodatkowo `schema.sql` **nie dodaje kolumn** do istniejących tabel, więc każdy w zespole musiałby zrobić `docker compose down -v` albo ręczny `ALTER`.

**Rekomendacja: zamiast kopiować, przebudować salda na tabelę.**
- `waluty` (kod PK, nazwa): PLN, EUR, USD, CHF, GBP, …
- `salda` (id_konta, waluta → waluty, saldo, PK `(id_konta, waluta)`, `CHECK saldo >= 0`)
- Procedury robią `SELECT ... FOR UPDATE` na wierszu `salda` zamiast `CASE` po kolumnach, więc stają się krótsze.
- `NbpService` czyta listę walut z tabeli `waluty`. Tabela C NBP ma m.in. USD, EUR, CHF, GBP, JPY, CZK, NOK, SEK, DKK, CAD, AUD, HUF.

Efekt: kolejna waluta to **jeden `INSERT` do `waluty`**, bez zmian w kodzie. To dobry argument na prezentacji („Dodatkowa funkcjonalność / kreatywność” i „Architektura”).
Koszt: jednorazowa przebudowa schematu, procedur, modeli i endpointu salda. Najlepiej zrobić to **przed** B01–B04, żeby nie przepisywać nowych procedur dwa razy.
Uwaga: zmiana kształtu odpowiedzi `/saldo` (lista `[{waluta, saldo}]` zamiast pól `aktualneSaldoPln…`) dotyka mobile. Uzgodnić z nimi.

## Sugerowana kolejność

1. B03, B05: szybkie i odblokowują mobile.
2. ~~B16~~ (zrobione), potem B04.
3. B01, B02: auth zmienia wszystkie adresy, więc trzeba to szybko ogłosić zespołowi mobile.
4. B07, B10, B08: endpointy pod ekrany.
5. B11, B12, B13, B06: docker, testy, materiały do raportu.
6. P2/P3, jeśli zostanie czas.

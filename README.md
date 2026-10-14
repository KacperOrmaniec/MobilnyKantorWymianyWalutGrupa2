# MobilnyKantorWymianyWalutGrupa2

System mobilny kantoru wymiany walut (projekt zaliczeniowy). Wymagania: [requirements.md](requirements.md).

## Stack

| Warstwa           | Technologia                                   |
| ----------------- | --------------------------------------------- |
| Aplikacja mobilna | **React Native + Expo** (TypeScript), Android |
| Backend           | **.NET Web API** (ASP.NET Core, EF Core)      |
| Baza danych       | **PostgreSQL**, uruchamiany w **Dockerze**    |
| Kursy walut       | publiczne API NBP (`api.nbp.pl`)              |
| Zadania           | **backlog** CLI (`.backlog/`)                 |

## Wymagane narzędzia

Każdy w zespole potrzebuje:

| Narzędzie                                                            | Po co                                 | Instalacja                                        |
| -------------------------------------------------------------------- | ------------------------------------- | ------------------------------------------------- |
| **Git**                                                              | repozytorium                          | https://git-scm.com                               |
| **Docker Desktop**                                                   | baza PostgreSQL (`docker compose`)    | https://www.docker.com/products/docker-desktop    |
| **.NET SDK** (aktualny LTS)                                          | backend                               | https://dotnet.microsoft.com/download             |
| **Node.js** (aktualny LTS)                                           | aplikacja mobilna (Expo), backlog CLI | https://nodejs.org                                |
| **Expo Go** na telefonie z Androidem _lub_ emulator z Android Studio | uruchamianie aplikacji                | Sklep Play / https://developer.android.com/studio |
| **backlog** CLI                                                      | tablica zadań                         | `npm install -g backlog`                          |

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

## Konfiguracja lokalnego środowiska

### 1. Uruchomienie bazy danych

Projekt korzysta z PostgreSQL uruchamianego w Dockerze.

1. Zainstaluj i uruchom Docker Desktop.
2. Skopiuj plik `.env.example` do `.env`.
3. Ustaw własne hasła `POSTGRES_PASSWORD` i `PGADMIN_PASSWORD` w pliku `.env`.
4. W katalogu z `docker-compose.yml` wykonaj:

```powershell
docker compose up -d
```

PostgreSQL będzie dostępny na `localhost:5432`, a panel pgAdmin pod adresem [http://localhost:5050](http://localhost:5050).
Do pgAdmin zaloguj się adresem `admin@example.com` i hasłem `PGADMIN_PASSWORD` ustawionym w `.env`.

Status kontenerów sprawdzisz poleceniem `docker compose ps` (kontener `db` powinien mieć status `healthy`).
Polecenie `docker compose down` zatrzymuje kontenery; dane pozostają w wolumenach.

### 2. Konfiguracja połączenia z bazą w .NET

Projekt wykorzystuje **ASP.NET Core User Secrets**, aby nie przechowywać haseł w repozytorium Git.

W Visual Studio:

1. Kliknij prawym przyciskiem na projekt `Kantor.Api`.
2. Wybierz **Manage User Secrets**.
3. W otwartym pliku `secrets.json` dodaj:

```json
{
  "ConnectionStrings": {
    "KantorDb": "Host=localhost;Port=5432;Database=kantor;Username=kantor;Password=TWOJE_HASLO"
  },
  "Jwt": {
    "Key": "DOWOLNY_LOSOWY_CIAG_MIN_32_ZNAKI"
  }
}
```

Zastąp `TWOJE_HASLO` hasłem `POSTGRES_PASSWORD` ustawionym w pliku `.env`.
`Jwt:Key` to klucz do podpisywania tokenów logowania: dowolny losowy ciąg, **co najmniej 32 znaki** (bez niego API nie wystartuje). Można go wygenerować np. poleceniem `openssl rand -base64 48`. W Dockerze ten sam klucz podaje się zmienną `Jwt__Key`.
Jeśli zmienisz `POSTGRES_DB`, `POSTGRES_USER` lub `POSTGRES_PORT`, dostosuj także pola `Database`, `Username` i `Port` w powyższym połączeniu.

Plik `secrets.json` jest przechowywany lokalnie, poza repozytorium Git, i nie jest wysyłany na GitHuba.

### 3. Uruchomienie backendu

1. Upewnij się, że kontener PostgreSQL jest uruchomiony i ma status `healthy`.
2. Otwórz projekt w Visual Studio.
3. Uruchom `Kantor.Api`.

**Uwaga:** nie dodawaj pliku `.env` ani prawdziwych haseł do repozytorium. Plik `.env` jest już uwzględniony w `.gitignore`.

### Inicjalizacja schematu bazy danych

Przy każdym starcie kontenera `db` wykonywany jest skrypt
`backend/database/schema.sql`: tworzy brakujące tabele oraz tworzy lub aktualizuje
procedury przez `CREATE OR REPLACE PROCEDURE`, również w istniejącej bazie.
Istniejące tabele i dane pozostają bez zmian. Skrypt nie dodaje kolumn do
istniejących tabel.

**Zmiana struktury tabel** (np. przejście sald na tabelę `salda`) wymaga jednorazowego
wyczyszczenia bazy: `docker compose down -v`, potem `docker compose up -d`.

### Dodanie nowej waluty

Dopisz wiersz do `INSERT INTO public.waluty` w `schema.sql` i zrestartuj kontener `db`.
Kod musi być w tabeli C NBP (np. JPY, CZK, NOK, SEK). Zmiany w kodzie nie są potrzebne.

## Requesty API

W folderze [postman/](postman/) znajdują się kolekcje requestów backendu i API NBP, które można zaimportować do Postmana.

Adres bazowy: `http://localhost:5171`. Body dla POST wysyłaj jako JSON.

**Logowanie:** najpierw `POST /auth/register`, potem `POST /auth/login`, który zwraca `{ "token": "...", "wygasa": "..." }` (token ważny 60 minut).
Endpointy z „tak” w kolumnie Token wymagają nagłówka `Authorization: Bearer <token>`; bez niego zwracają `401`.
Konto zawsze wynika z tokena (`/konta/me/...`), więc użytkownik ma dostęp tylko do własnych danych.

| Metoda | Adres | Token | Co robi | Body (JSON) |
| ------ | ----- | ----- | ------- | ----------- |
| GET | `/test` | — | Sprawdza działanie API. | — |
| GET | `/testdb` | — | Sprawdza połączenie z bazą. | — |
| POST | `/auth/register` | — | Rejestruje użytkownika (`201`). | `{"login":"jan","haslo":"tajnehaslo","imie":"Jan","nazwisko":"Kowalski"}` |
| POST | `/auth/login` | — | Loguje i zwraca token JWT. | `{"login":"jan","haslo":"tajnehaslo"}` |
| GET | `/konta/me` | tak | Profil: id, login, imię, nazwisko i salda. | — |
| GET | `/konta/me/saldo` | tak | Pobiera salda we wszystkich walutach. | — |
| POST | `/konta/me/doladowanie` | tak | Doładowuje saldo PLN. | `{"kwota":100}` |
| GET | `/konta/me/historia-przelewow` | tak | Pobiera przelewy z nazwami nadawcy i odbiorcy. | — |
| GET | `/konta/me/historia-przewalutowania` | tak | Pobiera historię wymiany walut. | — |
| GET | `/kursy` | — | Odświeża kursy walut z NBP i zwraca je z bazy. | — |
| GET | `/kursy/historyczne` | — | Uzupełnia ostatnie 7 dni NBP i zwraca historię z bazy. | — |
| POST | `/przelewy` | tak | Wykonuje przelew z konta zalogowanego do konta o podanym loginie. | `{"loginOdbiorcy":"anna","kwota":50,"waluta":"PLN"}` |
| POST | `/konta/me/przewalutowanie` | tak | Wymienia PLN na walutę obcą lub odwrotnie. | `{"waluta":"EUR","kwota":10,"typTransakcji":"ZAKUP"}` |

Rejestracja: login 3–100 znaków (litery bez polskich znaków, cyfry, `.`, `_`, `-`), hasło min. 8 znaków, imię i nazwisko niepuste (maks. 100 znaków). Spacje na początku i końcu są obcinane.
Zły login i złe hasło przy logowaniu dają ten sam `401` z komunikatem `Nieprawidłowy login lub hasło.`.

Obsługiwane waluty są w tabeli `waluty` (PLN, EUR, USD, CHF, GBP). Przelew obsługuje każdą z nich. Przy przewalutowaniu `kwota` oznacza ilość waluty obcej: `ZAKUP` kupuje walutę za PLN, a `SPRZEDAZ` sprzedaje ją za PLN. Kwoty muszą być dodatnie i mieć najwyżej 2 miejsca po przecinku.

## Podejście Database First

Projekt korzysta z podejścia **Database First**: kontekst `KantorDbContext.cs` w katalogu `backend/src/Kantor.Api/Data/` oraz klasy modeli w `backend/src/Kantor.Api/Models/` zostały wygenerowane narzędziem **EF Reverse Engineering** na podstawie istniejącego schematu bazy danych PostgreSQL.

## Tabele i procedury w bazie danych

Definicje znajdują się w [backend/database/schema.sql](backend/database/schema.sql).

### Tabele

| Tabela                     | Co przechowuje                                                    |
| -------------------------- | ----------------------------------------------------------------- |
| `konta`                    | Dane użytkowników: login, hash hasła, imię i nazwisko.            |
| `waluty`                   | Słownik obsługiwanych walut (kod, nazwa).                         |
| `salda`                    | Saldo konta w danej walucie; brak wiersza oznacza saldo 0.        |
| `historia_przelewów`       | Przelewy między kontami: nadawcę, odbiorcę, kwotę, walutę i datę. |
| `historia_przewalutowania` | Wymiany walut: konto, waluty, kwoty, zastosowany kurs i datę.     |
| `aktualne_kursy_walut`     | Bieżące kursy kupna i sprzedaży oraz czas aktualizacji.           |
| `historyczne_kursy_walut`  | Średnie kursy walut dla poszczególnych dni.                       |

### Procedury

| Procedura                       | Co robi                                                                                                                   |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `przelew`                       | Przenosi środki między dwoma kontami w dowolnej walucie z `waluty` i zapisuje historię. Sprawdza poprawność danych i dostępne saldo. |
| `przewalutowanie`               | Wymienia PLN na walutę obcą lub odwrotnie, aktualizuje salda i zapisuje historię wraz z kursem.                               |
| `zmiana_aktualnego_kursu_walut` | Dodaje lub aktualizuje kurs kupna i sprzedaży podanej waluty oraz zwraca czas aktualizacji.                               |

Procedury `przelew` i `przewalutowanie` blokują konta przez `FOR UPDATE` i zatwierdzają zmiany sald oraz zapis historii razem albo wcale — błąd zapisu historii powoduje wycofanie zmian sald.

W procedurze `przewalutowanie` typ operacji jest opisany z perspektywy użytkownika:
`ZAKUP` oznacza, że klient płaci PLN i otrzymuje walutę obcą po kursie sprzedaży kantoru,
a `SPRZEDAZ` — że klient oddaje walutę obcą i otrzymuje PLN po kursie zakupu kantoru.

Zaokrąglenie kwoty PLN przy przewalutowaniu odbywa się po stronie bazy danych: procedura `przewalutowanie` używa `ROUND(kwota * v_kurs, 2)`, czyli zaokrągla wynik do dwóch miejsc po przecinku (groszy).

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

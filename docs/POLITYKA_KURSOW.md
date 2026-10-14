# Polityka wykorzystania kursów NBP

Dokument opisuje sposób użycia kursów z API NBP przy kupnie i sprzedaży walut (wymaganie z pkt 4 `requirements.md`). Fragment do raportu z etapu 1.

## Źródło kursów

| Zastosowanie | Tabela NBP | Pole | Adres |
|---|---|---|---|
| Kupno i sprzedaż waluty | **C** (kursy kupna i sprzedaży) | `bid`, `ask` | `exchangerates/rates/C/{waluta}/` |
| Kursy archiwalne (podgląd, wykres) | **A** (kursy średnie) | `mid` | `exchangerates/rates/A/{waluta}/{od}/{do}/` |

- Waluta rozliczeniowa to **PLN**. Każda wymiana to PLN ↔ waluta obca. Wymiana bezpośrednia, np. EUR → USD, nie jest obsługiwana.
- Obsługiwane waluty są w tabeli `waluty` (PLN, EUR, USD, CHF, GBP). Kod waluty musi występować w tabeli C NBP.
- Kantor stosuje kursy z tabeli C bez dodatkowej marży. Różnica `ask − bid` jest spreadem kantoru.

## Kierunek kursu

Typ transakcji jest opisany z perspektywy użytkownika:

| Operacja | Użytkownik | Kurs | Pole NBP | Kolumna w bazie |
|---|---|---|---|---|
| `ZAKUP` | płaci PLN, otrzymuje walutę | sprzedaży kantoru | `ask` | `kurs_sprzedazy` |
| `SPRZEDAZ` | oddaje walutę, otrzymuje PLN | kupna kantoru | `bid` | `kurs_zakupu` |

`kwota` w żądaniu oznacza zawsze ilość waluty obcej. Kwota w PLN liczy się w bazie jako `ROUND(kwota × kurs, 2)`, czyli z zaokrągleniem do grosza.

## Świeżość kursu

- **Przed każdą wymianą** backend pobiera z NBP aktualne kursy wszystkich walut i zapisuje je w `aktualne_kursy_walut`. Dopiero potem wywołuje procedurę `przewalutowanie`. Wymiana zawsze używa najnowszego opublikowanego kursu.
- `GET /kursy` również odświeża kursy przed zwróceniem ich z bazy.
- NBP publikuje tabelę C raz dziennie w dni robocze. W weekendy i święta API zwraca ostatnią opublikowaną tabelę, więc wymiana działa po kursie z ostatniego dnia roboczego.
- Odświeżenie jest atomowe: najpierw pobierane są kursy wszystkich walut, potem zapis idzie w jednej transakcji. Błąd NBP nie zostawi połowy kursów zaktualizowanych.

## Brak kursu / niedostępność NBP

| Sytuacja | Zachowanie |
|---|---|
| NBP zwraca błąd lub niepoprawne dane | wymiana **nie jest wykonywana**, `502` |
| NBP nie odpowiada w 15 s | wymiana **nie jest wykonywana**, `504` |
| brak kursu waluty w bazie | procedura zgłasza `Brak kursu dla waluty …`, `400` |

Świadomie nie używamy starego kursu z bazy, gdy NBP jest niedostępne. Dzięki temu użytkownik nie wymieni waluty po nieaktualnym kursie.

## Zapis kursu w transakcji

- Każda wymiana zapisuje w `historia_przewalutowania` zastosowany kurs (`Kurs_przewalutowania`), waluty i kwoty po obu stronach oraz datę i czas (`Timestamp`).
- Historia nie odwołuje się do tabeli kursów, tylko przechowuje kopię wartości. Późniejsza zmiana kursu nie zmienia więc danych historycznych.
- Zmiana sald i zapis historii odbywają się w jednej procedurze, przy zablokowanym koncie (`FOR UPDATE`): wykonuje się wszystko albo nic.

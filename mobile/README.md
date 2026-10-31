# Kantor — aplikacja mobilna

Aplikacja mobilna do wymiany walut (system kantoru). Zbudowana na **Expo 57**, **expo-router** i **TypeScript**.

## Wymagania

- [Node.js](https://nodejs.org) w wersji LTS
- **Expo Go w wersji 57** — [pobierz z expo.dev/go](https://expo.dev/go)
- Uruchomiony backend API (domyślnie `http://localhost:5171`) — patrz [../backend/README.md](../backend/README.md)

> Ważne: projekt używa Expo 57, więc aplikacja **Expo Go musi być w wersji 57**. Starsza lub nowsza wersja nie uruchomi projektu.

## Instalacja

```bash
cd mobile
npm install
```

## Uruchomienie

```bash
npx expo start
```

Następnie:

- **Telefon** — zeskanuj kod QR aplikacją Expo Go (wersja 57),
- **Emulator Androida** — wciśnij `a` w terminalu.

### Adres backendu

Aplikacja łączy się z API pod adresem zależnym od tego, gdzie ją uruchamiasz:

| Środowisko                      | Adres                                                                 |
| ------------------------------- | --------------------------------------------------------------------- |
| Emulator Androida               | `http://10.0.2.2:5171` (domyślnie, nie wymaga konfiguracji)           |
| Telefon w tej samej sieci Wi-Fi | `EXPO_PUBLIC_API_URL` w pliku `.env`, np. `http://192.168.1.100:5171` |

#### Plik `.env`

Konfiguracja wzorowana jest na `.env.example`. Skopiuj go do `.env`:

```powershell
Copy-Item .env.example .env
```

```bash
# Git Bash / macOS / Linux
cp .env.example .env
```

W `.env.example` linia `EXPO_PUBLIC_API_URL` jest **zakomentowana** (zaczyna się od `#`). **Odkomentuj ją tylko wtedy, gdy uruchamiasz aplikację na fizycznym telefonie** — usuń `#` z początku linii i wpisz IP komputera w tej samej sieci Wi-Fi:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.100:5171
```

**Nie musisz nic zmieniać, jeśli używasz emulatora Androida** — aplikacja korzysta wtedy z domyślnego `http://10.0.2.2:5171`, a linia może zostać zakomentowana.

Po **każdej** zmianie w `.env` zrestartuj Metro z wyczyszczonym cache — zmienne `EXPO_PUBLIC_*` są wstrzykiwane do bundla przy jego budowaniu, więc sam hot-reload ich nie odświeży:

```bash
npx expo start --clear
```

> `.env` jest w `.gitignore` i nigdy nie trafia do repozytorium — każdy deweloper ma własny, z własnym IP. Do repo commitowany jest tylko `.env.example` ze wzorem (bez prawdziwego IP).
>
> Pamiętaj, że wszystkie zmienne `EXPO_PUBLIC_*` są widoczne w zbudowanej aplikacji — nie umieszczaj w nich haseł ani kluczy API.

#### Uruchomienie backendu dla telefonu

Dla telefonu backend musi nasłuchiwać na wszystkich interfejsach, nie tylko na `localhost`:

```bash
dotnet run --project backend/src/Kantor.Api --launch-profile http-siec
```

## Struktura projektu

```
src/
  app/          # ekrany i routing (expo-router, routing po plikach)
  components/   # komponenty UI
  hooks/        # hooki (motyw, store, flagi walut)
  lib/          # klient API, typy DTO, React Query
  constants/    # motyw, kolory
```

## Przydatne skrypty

```bash
npm run android   # uruchom na emulatorze Androida
npm run ios       # uruchom na symulatorze iOS
npm run web       # uruchom w przeglądarce
npm run lint      # sprawdź kod
```

## Dokumentacja

- [Expo](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [Expo Go](https://expo.dev/go)

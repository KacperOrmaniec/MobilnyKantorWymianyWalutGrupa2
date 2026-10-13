#!/usr/bin/env bash
# Przerwij skrypt przy błędzie polecenia lub użyciu nieustawionej zmiennej.
set -Eeuo pipefail

# Usuń znacznik gotowości z poprzedniego uruchomienia.
ready_file=/tmp/kantor-schema-ready
rm -f "$ready_file"

# Uruchom PostgreSQL w tle przez standardowy skrypt obrazu Docker.
# Przy pierwszym starcie przygotuje on również katalog danych bazy.
docker-entrypoint.sh postgres "$@" &
# Zapamiętaj numer procesu, aby móc sprawdzać jego stan i go zatrzymać.
postgres_pid=$!

# Przy kończeniu skryptu usuń znacznik gotowości i zatrzymaj bazę.
cleanup() {
    rm -f "$ready_file"
    if kill -0 "$postgres_pid" 2>/dev/null; then
        kill -TERM "$postgres_pid"
    fi
    wait "$postgres_pid" || true
}
# Wykonaj sprzątanie także po błędzie lub sygnale zatrzymania kontenera.
trap cleanup EXIT
trap 'exit 143' TERM
trap 'exit 130' INT

# Ustaw hasło dla klienta bazy i limit 5 sekund na nawiązanie połączenia.
export PGPASSWORD="$POSTGRES_PASSWORD"
export PGCONNECT_TIMEOUT=5
# Czekaj na połączenia TCP. Tymczasowa baza używana podczas pierwszej
# inicjalizacji ich nie przyjmuje, więc poczekamy na właściwy serwer.
until pg_isready -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
    # Jeśli proces bazy zakończył się, przerwij oczekiwanie.
    if ! kill -0 "$postgres_pid" 2>/dev/null; then
        wait "$postgres_pid"
        exit 1
    fi
    # Sprawdź ponownie za sekundę.
    sleep 1
done

# Wykonaj SQL tworzący brakujące tabele oraz tworzący lub aktualizujący procedury.
# Opcja ON_ERROR_STOP zatrzymuje wykonanie przy pierwszym błędzie SQL.
echo 'Checking the kantor database schema...'
psql -X -h 127.0.0.1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
    --set=ON_ERROR_STOP=1 --file=/opt/kantor-db/schema.sql
# Hasło nie jest już potrzebne w środowisku tego skryptu.
unset PGPASSWORD
# Dopiero teraz healthcheck Dockera może uznać bazę za gotową (healthy).
touch "$ready_file"
echo 'Kantor database schema is ready.'

# Utrzymuj skrypt i kontener uruchomione tak długo, jak działa baza.
wait "$postgres_pid"

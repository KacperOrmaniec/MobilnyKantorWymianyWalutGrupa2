<#
  Konfiguracja lokalnego środowiska Kantor. Można uruchamiać wielokrotnie.

    .\setup.ps1          .env + User Secrets + baza i pgAdmin w Dockerze (API uruchamiasz z Visual Studio)
    .\setup.ps1 -Api     to samo + API w Dockerze (np. zespół mobile)
    .\setup.ps1 -Reset   dodatkowo czyści bazę (docker compose down -v) i losuje nowe hasła

  Jeśli Windows blokuje skrypty:  powershell -ExecutionPolicy Bypass -File .\setup.ps1
#>
param([switch]$Api, [switch]$Reset)

Set-Location $PSScriptRoot
$sciezkaEnv = Join-Path $PSScriptRoot '.env'
$utf8 = New-Object Text.UTF8Encoding $false

# Losowy ciąg hex (bez znaków, które psują connection string).
function Losowy([int]$bajty) {
    $b = New-Object byte[] $bajty
    [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b)
    ($b | ForEach-Object { $_.ToString('x2') }) -join ''
}

# Wartość z .env (bez komentarza po " #") albo $domyslna.
function Pobierz([string]$klucz, [string]$domyslna = '') {
    $linia = $script:linie | Where-Object { $_ -match "^\s*$klucz\s*=" } | Select-Object -First 1
    if (-not $linia) { return $domyslna }
    $wartosc = (($linia -split '=', 2)[1] -replace '\s+#.*$', '').Trim()
    if ($wartosc) { $wartosc } else { $domyslna }
}

# Podmienia linię w .env albo dopisuje ją na końcu.
function Ustaw([string]$klucz, [string]$wartosc) {
    if ($script:linie -match "^\s*$klucz\s*=") {
        $script:linie = $script:linie | ForEach-Object { if ($_ -match "^\s*$klucz\s*=") { "$klucz=$wartosc" } else { $_ } }
    } else {
        $script:linie += "$klucz=$wartosc"
    }
}

# 1. Docker musi działać.
docker info *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Docker nie działa. Uruchom Docker Desktop i spróbuj ponownie.' -ForegroundColor Red
    exit 1
}

# 2. Plik .env.
$nowyEnv = -not (Test-Path $sciezkaEnv)
if ($nowyEnv) {
    Copy-Item (Join-Path $PSScriptRoot '.env.example') $sciezkaEnv
    Write-Host 'Utworzono .env z .env.example.'
}
$script:linie = @([IO.File]::ReadAllLines($sciezkaEnv))

# Hasła losujemy tylko dla nowej bazy: istniejąca baza i pgAdmin pamiętają hasło z pierwszego startu.
if ($nowyEnv -or $Reset) {
    Ustaw 'POSTGRES_PASSWORD' (Losowy 16)
    Ustaw 'PGADMIN_PASSWORD' (Losowy 8)
    Write-Host 'Wylosowano hasła bazy i pgAdmin (są w .env).'
}
$jwt = Pobierz 'JWT_KEY'
if ($jwt.Length -lt 32 -or $jwt -like 'zmien_mnie*') {
    Ustaw 'JWT_KEY' (Losowy 32)
    Write-Host 'Wygenerowano JWT_KEY.'
}
[IO.File]::WriteAllLines($sciezkaEnv, [string[]]$script:linie, $utf8)

$baza = Pobierz 'POSTGRES_DB' 'kantor'
$uzytkownik = Pobierz 'POSTGRES_USER' 'kantor'
$port = Pobierz 'POSTGRES_PORT' '5432'
$haslo = Pobierz 'POSTGRES_PASSWORD'

# 3. User Secrets dla API uruchamianego z Visual Studio (te same wartości co w .env).
if (Get-Command dotnet -ErrorAction SilentlyContinue) {
    $projekt = 'backend/src/Kantor.Api'
    dotnet user-secrets set 'ConnectionStrings:KantorDb' "Host=localhost;Port=$port;Database=$baza;Username=$uzytkownik;Password=$haslo" --project $projekt | Out-Null
    dotnet user-secrets set 'Jwt:Key' (Pobierz 'JWT_KEY') --project $projekt | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Host 'Ustawiono User Secrets (ConnectionStrings:KantorDb, Jwt:Key).' }
    else { Write-Host 'Nie udało się ustawić User Secrets.' -ForegroundColor Yellow }
} else {
    Write-Host 'Brak .NET SDK: pomijam User Secrets (potrzebne tylko do uruchamiania API z Visual Studio).'
}

# 4. Kontenery.
if ($Reset) {
    Write-Host 'Czyszczę bazę (docker compose down -v)...'
    docker compose down -v
}
Write-Host 'Uruchamiam kontenery i czekam, aż baza będzie gotowa...'
if ($Api) { docker compose up -d --build --wait --quiet-pull } else { docker compose up -d --wait --quiet-pull db pgadmin }
if ($LASTEXITCODE -ne 0) {
    Write-Host 'Kontenery nie wystartowały. Sprawdź: docker compose logs db api' -ForegroundColor Red
    exit 1
}

# 5. Baza sprzed przejścia sald na tabelę salda trzeba raz wyczyścić.
$staraBaza = docker compose exec -T db psql -U $uzytkownik -d $baza -tAc "SELECT 1 FROM information_schema.columns WHERE table_name = 'konta' AND column_name = 'Aktualne_Saldo_PLN'"
if ("$staraBaza".Trim() -eq '1') {
    Write-Host ''
    Write-Host 'Baza ma starą strukturę (salda w tabeli konta). Uruchom raz: .\setup.ps1 -Reset  (usuwa tylko dane testowe)' -ForegroundColor Yellow
}

Write-Host ''
Write-Host 'Gotowe.' -ForegroundColor Green
Write-Host "  Baza:          localhost:$port (hasło w .env)"
Write-Host "  pgAdmin:       http://localhost:5050  (admin@example.com / PGADMIN_PASSWORD z .env)"
if ($Api) { Write-Host "  API:           http://localhost:$(Pobierz 'API_PORT' '5171')  (test: /testdb)" }
else { Write-Host '  API:           uruchom Kantor.Api w Visual Studio (http://localhost:5171)' }
Write-Host '  Konto testowe: test / test123'

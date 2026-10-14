using Kantor.Api.Data;
using Kantor.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using System.Text.Json;

namespace Kantor.Api.Controllers;

[ApiController]
[Route("kursy")]
public class KursyController(KantorDbContext db, NbpService nbp) : ControllerBase
{
    // Odświeża EUR i USD w NBP, a następnie zwraca kursy z bazy.
    [HttpGet]
    public async Task<IActionResult> PobierzKursy(CancellationToken cancellationToken)
    {
        try
        {
            await nbp.AktualizujAktualneKursy(cancellationToken);
            var kursy = await db.AktualneKursyWaluts.AsNoTracking()
                .OrderBy(k => k.Waluta)
                .Select(k => new
                {
                    k.Id,
                    k.Timestamp,
                    k.Waluta,
                    KursZakupuPrzezKantor = k.KursZakupu,
                    KursSprzedazyPrzezKantor = k.KursSprzedazy
                })
                .ToListAsync(cancellationToken);

            return Ok(kursy);
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException)
        {
            return StatusCode(502, new { error = "Nie udało się pobrać kursów z NBP." });
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(504, new { error = "Przekroczono czas oczekiwania na NBP." });
        }
        catch (PostgresException)
        {
            return StatusCode(500, new { error = "Błąd bazy danych." });
        }
    }

    // Uzupełnia kursy średnie NBP z zakresu dat (domyślnie ostatnie 7 dni) i zwraca je rosnąco po dacie.
    [HttpGet("historyczne")]
    public async Task<IActionResult> PobierzHistoryczneKursy(
        [FromQuery] string? waluta,
        [FromQuery] string? od,
        [FromQuery(Name = "do")] string? doParam,
        CancellationToken cancellationToken)
    {
        if (!SprobujData(od, out var odDaty) || !SprobujData(doParam, out var doDaty))
            return BadRequest(new { error = "Daty podaj w formacie RRRR-MM-DD." });

        var dzis = NbpService.DzisWPolsce();
        var koniec = doDaty ?? dzis;
        var poczatek = odDaty ?? koniec.AddDays(-6);

        if (poczatek > koniec)
            return BadRequest(new { error = "Data 'od' nie może być późniejsza niż 'do'." });
        if (koniec.DayNumber - poczatek.DayNumber + 1 > 93)
            return BadRequest(new { error = "Zakres dat może mieć najwyżej 93 dni." });
        if (koniec > dzis)
            return BadRequest(new { error = "Data 'do' nie może być w przyszłości." });

        try
        {
            var waluty = await nbp.PobierzWaluty(cancellationToken);
            if (waluta is not null)
            {
                var kod = waluta.Trim().ToUpperInvariant();
                if (!waluty.Contains(kod))
                    return BadRequest(new { error = "Nieobsługiwana waluta." });
                waluty = [kod];
            }

            await nbp.AktualizujHistoryczneKursy(waluty, poczatek, koniec, cancellationToken);
            var historia = await db.HistoryczneKursyWaluts.AsNoTracking()
                .Where(k => waluty.Contains(k.Waluta) && k.Data >= poczatek && k.Data <= koniec)
                .OrderBy(k => k.Data).ThenBy(k => k.Waluta)
                .ToListAsync(cancellationToken);

            return Ok(historia);
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException)
        {
            return StatusCode(502, new { error = "Nie udało się pobrać kursów z NBP." });
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(504, new { error = "Przekroczono czas oczekiwania na NBP." });
        }
        catch (PostgresException)
        {
            return StatusCode(500, new { error = "Błąd bazy danych." });
        }
    }

    // Parsuje opcjonalną datę RRRR-MM-DD; brak parametru jest poprawny.
    private static bool SprobujData(string? tekst, out DateOnly? data)
    {
        data = null;
        if (string.IsNullOrWhiteSpace(tekst)) return true;
        if (!DateOnly.TryParseExact(tekst, "yyyy-MM-dd", out var wynik)) return false;
        data = wynik;
        return true;
    }
}

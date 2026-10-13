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

    // Uzupełnia ostatnie 7 dni kursów średnich NBP i zwraca zapisaną historię.
    [HttpGet("historyczne")]
    public async Task<IActionResult> PobierzHistoryczneKursy(CancellationToken cancellationToken)
    {
        try
        {
            await nbp.AktualizujHistoryczneKursy(cancellationToken);
            var historia = await db.HistoryczneKursyWaluts.AsNoTracking()
                .OrderByDescending(k => k.Data).ThenBy(k => k.Waluta)
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
}

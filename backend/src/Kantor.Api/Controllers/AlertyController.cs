using Kantor.Api.Data;
using Kantor.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kantor.Api.Controllers;

// Alerty kursowe; spełnienie oznacza trigger w bazie przy każdej zmianie kursu.
[ApiController]
[Authorize]
[Route("konta/me/alerty")]
public class AlertyController(KantorDbContext db) : ControllerBase
{
    private const int LimitAktywnych = 20;

    // Lista alertów zalogowanego użytkownika, od najnowszych.
    [HttpGet]
    public async Task<IActionResult> PobierzAlerty() =>
        Ok(await Widok(User.IdKonta()).ToListAsync());

    // Tworzy alert; jeśli warunek już jest spełniony, baza od razu go oznacza.
    [HttpPost]
    public async Task<IActionResult> DodajAlert([FromBody] DodajAlert request)
    {
        var id = User.IdKonta();
        var waluta = request.Waluta?.Trim().ToUpperInvariant();
        var typ = request.Typ?.Trim().ToUpperInvariant();

        if (waluta is null or "PLN" || !await db.Waluty.AnyAsync(w => w.Kod == waluta))
            return BadRequest(new { error = "Nieobsługiwana waluta. Listę walut zwraca GET /kursy." });
        if (typ is not ("ZAKUP" or "SPRZEDAZ"))
            return BadRequest(new { error = "Podaj typ alertu ZAKUP lub SPRZEDAZ." });
        if (request.Prog is <= 0 or >= 1_000_000_000_000m || request.Prog != Math.Round(request.Prog, 6))
            return BadRequest(new { error = "Próg musi być dodatni i mieć najwyżej 6 miejsc po przecinku." });
        if (await db.AlertyKursowe.CountAsync(a => a.IdKonta == id && a.Spelniono == null) >= LimitAktywnych)
            return BadRequest(new { error = $"Możesz mieć najwyżej {LimitAktywnych} aktywnych alertów." });

        var alert = new AlertKursowy { IdKonta = id, Waluta = waluta, Typ = typ, Prog = request.Prog };
        db.AlertyKursowe.Add(alert);
        await db.SaveChangesAsync();

        return Created("/konta/me/alerty", await Widok(id, alert.Id).FirstAsync());
    }

    // Usuwa własny alert; cudzy lub nieistniejący daje 404.
    [HttpDelete("{idAlertu:long}")]
    public async Task<IActionResult> UsunAlert(long idAlertu)
    {
        var id = User.IdKonta();
        var usuniete = await db.AlertyKursowe.Where(a => a.Id == idAlertu && a.IdKonta == id).ExecuteDeleteAsync();
        return usuniete == 0 ? NotFound(new { error = "Alert nie istnieje." }) : NoContent();
    }

    // Alerty konta z aktualnym kursem odpowiednim dla typu (ZAKUP: sprzedaży, SPRZEDAZ: zakupu).
    private IQueryable<object> Widok(long idKonta, long? idAlertu = null) =>
        db.AlertyKursowe.AsNoTracking()
            .Where(a => a.IdKonta == idKonta && (idAlertu == null || a.Id == idAlertu))
            .OrderByDescending(a => a.Utworzono).ThenByDescending(a => a.Id)
            .Select(a => new
            {
                a.Id,
                a.Waluta,
                a.Typ,
                a.Prog,
                a.Utworzono,
                a.Spelniono,
                a.KursSpelnienia,
                AktualnyKurs = db.AktualneKursyWaluts
                    .Where(k => k.Waluta == a.Waluta)
                    .Select(k => (decimal?)(a.Typ == "ZAKUP" ? k.KursSprzedazy : k.KursZakupu))
                    .FirstOrDefault()
            });
}

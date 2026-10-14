using Kantor.Api.Models;
using Kantor.Api.Services;
using System.Text.Json;
using Kantor.Api.Validation;
using Microsoft.AspNetCore.Authorization;
using Npgsql;
using Kantor.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kantor.Api.Controllers;

[ApiController]
[Authorize]
[Route("konta")]
public class KontaController(KantorDbContext db, NbpService nbp) : ControllerBase
{


    // Pobiera profil zalogowanego użytkownika razem z saldami.
    [HttpGet("me")]
    public async Task<IActionResult> PobierzProfil()
    {
        var id = User.IdKonta();
        var konto = await db.Konta.AsNoTracking().FirstOrDefaultAsync(k => k.Id == id);
        if (konto is null)
            return NotFound(new { error = "Konto nie istnieje." });

        return Ok(new { konto.Id, konto.Login, konto.Imie, konto.Nazwisko, Salda = await PobierzSalda(id) });
    }

    // Pobiera salda użytkownika we wszystkich walutach (PLN pierwszy, brak wiersza = 0).
    [HttpGet("me/saldo")]
    public async Task<IActionResult> PobierzSaldo()
    {
        var id = User.IdKonta();
        if (!await db.Konta.AnyAsync(k => k.Id == id))
            return NotFound(new { error = "Konto nie istnieje." });

        return Ok(new { Id = id, Salda = await PobierzSalda(id) });
    }

    // Salda konta we wszystkich walutach: wspólne dla /konta/me i /konta/me/saldo.
    private async Task<object> PobierzSalda(long id) =>
        await db.Waluty.AsNoTracking()
            .OrderBy(w => w.Kod != "PLN").ThenBy(w => w.Kod)
            .Select(w => new
            {
                Waluta = w.Kod,
                w.Nazwa,
                Saldo = w.Salda.Where(s => s.IdKonta == id).Select(s => s.Kwota).FirstOrDefault()
            })
            .ToListAsync();




    // Dodaje podaną kwotę do salda PLN użytkownika.
    [HttpPost("me/doladowanie")]
    public async Task<IActionResult> DoladujKonto([FromBody] DoladujSaldo request)
    {
        var id = User.IdKonta();
        if (!KwotaValidator.PoprawnaKwota(request.Kwota))
            return BadRequest(new { error = "Kwota musi być dodatnia, mieć najwyżej 2 miejsca po przecinku." });

        try
        {
            await db.Database.ExecuteSqlInterpolatedAsync($"""
                INSERT INTO public.salda AS s (id_konta, waluta, saldo)
                VALUES ({id}, 'PLN', {request.Kwota})
                ON CONFLICT ON CONSTRAINT salda_pkey DO UPDATE SET saldo = s.saldo + EXCLUDED.saldo
                """);

            return Ok(new { message = "Saldo PLN zostało doładowane." });
        }
        catch (PostgresException ex) when (ex.SqlState == "23503")
        {
            return NotFound(new { error = "Konto nie istnieje." });
        }
        catch (PostgresException)
        {
            return StatusCode(500, new { error = "Błąd bazy danych." });
        }
    }




    // Pobiera przelewy wysłane i odebrane przez użytkownika.
    [HttpGet("me/historia-przelewow")]
    public async Task<IActionResult> PobierzHistoriePrzelewow()
    {
        var id = User.IdKonta();
        if (!await db.Konta.AnyAsync(k => k.Id == id))
            return NotFound(new { error = "Konto nie istnieje." });

        var historia = await db.HistoriaPrzelewóws.AsNoTracking()
            .Where(p => p.IdNadawcy == id || p.IdOdbiorcy == id)
            .OrderByDescending(p => p.Timestamp).ThenByDescending(p => p.Id)
            .Select(p => new
            {
                p.Id,
                p.Timestamp,
                p.IdNadawcy,
                NazwaNadawcy = p.IdNadawcyNavigation.Imie + " " + p.IdNadawcyNavigation.Nazwisko,
                p.IdOdbiorcy,
                NazwaOdbiorcy = p.IdOdbiorcyNavigation.Imie + " " + p.IdOdbiorcyNavigation.Nazwisko,
                p.Kwota,
                p.Waluta
            }) //wykrta relacja z bazy przez EF
            .ToListAsync();

        return Ok(historia);
    }





    // Pobiera historię wymiany walut użytkownika.
    [HttpGet("me/historia-przewalutowania")]
    public async Task<IActionResult> PobierzHistoriePrzewalutowania()
    {
        var id = User.IdKonta();
        if (!await db.Konta.AnyAsync(k => k.Id == id))
            return NotFound(new { error = "Konto nie istnieje." });

        var historia = await db.HistoriaPrzewalutowania.AsNoTracking()
            .Where(p => p.IdKonta == id)
            .OrderByDescending(p => p.Timestamp).ThenByDescending(p => p.Id)
            .Select(p => new { p.Id, p.Timestamp, p.IdKonta, p.KursPrzewalutowania,
                p.WalutaSprzedana, p.WalutaKupiona, p.KwotaSprzedana, p.KwotaKupiona })
            .ToListAsync();

        return Ok(historia);
    }




    // Odświeża kursy NBP i wymienia PLN na walutę obcą lub odwrotnie.
    [HttpPost("me/przewalutowanie")]
    public async Task<IActionResult> PrzewalutujKonto([FromBody] PrzewalutujSaldo request,
        CancellationToken cancellationToken)
    {
        var id = User.IdKonta();
        var waluta = request.Waluta?.Trim().ToUpperInvariant();

        var typ = request.TypTransakcji?.Trim().ToUpperInvariant();

        if (!KwotaValidator.PoprawnaKwota(request.Kwota))
        {
            return BadRequest(new { error = "Podaj dodatnią kwotę waluty z najwyżej 2 miejscami po przecinku." });
        }

        if (waluta is null or "PLN" || !await db.Waluty.AnyAsync(w => w.Kod == waluta, cancellationToken))
        {
            return BadRequest(new { error = "Nieobsługiwana waluta. Listę walut zwraca GET /kursy." });
        }

        if (typ is not ("ZAKUP" or "SPRZEDAZ"))
        {
            return BadRequest(new { error = "Podaj typ przewalutowania ZAKUP lub SPRZEDAZ" });
        }

        try
        {
            // Najpierw zapisuje najnowsze kursy, dopiero potem wykonuje wymianę.
            await nbp.AktualizujAktualneKursy(cancellationToken);

            // Kwota oznacza ilość waluty obcej. ZAKUP i SPRZEDAZ są z perspektywy użytkownika.
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"CALL public.przewalutowanie({id}, {waluta}::varchar, {request.Kwota}, {typ}::varchar)",
                cancellationToken);
            return Ok(new { message = "Przewalutowanie wykonane." });
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException)
        {
            return StatusCode(502, new { error = "Nie udało się pobrać kursów z NBP. Przewalutowanie nie zostało wykonane." });
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            return StatusCode(504, new { error = "Przekroczono czas oczekiwania na NBP. Przewalutowanie nie zostało wykonane." });
        }
        catch (PostgresException ex) when (ex.SqlState == "P0001")
        {
            return BadRequest(new { error = ex.MessageText });
        }
        catch (PostgresException)
        {
            return StatusCode(500, new { error = "Błąd bazy danych." });
        }
    }
}

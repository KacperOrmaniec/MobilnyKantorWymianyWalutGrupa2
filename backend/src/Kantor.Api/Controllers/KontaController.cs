using Kantor.Api.Models;
using Kantor.Api.Services;
using System.Text.Json;
using Kantor.Api.Validation;
using Microsoft.AspNetCore.Identity;
using Npgsql;
using Kantor.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kantor.Api.Controllers;

[ApiController]
[Route("konta")]
public class KontaController(KantorDbContext db, NbpService nbp) : ControllerBase
{


    // Pobiera salda PLN, EUR i USD użytkownika.
    [HttpGet("{id:long}/saldo")]
    public async Task<IActionResult> PobierzSaldo(long id)
    {
        var saldo = await db.Konta.AsNoTracking()
            .Where(k => k.Id == id)
            .Select(k => new { k.Id, k.AktualneSaldoPln, k.AktualneSaldoEur, k.AktualneSaldoUsd })
            .SingleOrDefaultAsync();

        return saldo is null ? NotFound(new { error = "Konto nie istnieje." }) : Ok(saldo);
    }




    // Dodaje użytkownika z zerowym saldem i zapisuje hash hasła.
    [HttpPost]
    public async Task<IActionResult> DodajKonto([FromBody] DodajUzytkownika request)
    {
        if (string.IsNullOrWhiteSpace(request.Login) || request.Login.Length > 100 ||
            string.IsNullOrWhiteSpace(request.Haslo) ||
            string.IsNullOrWhiteSpace(request.Imie) || request.Imie.Length > 100 ||
            string.IsNullOrWhiteSpace(request.Nazwisko) || request.Nazwisko.Length > 100)
        {
            return BadRequest(new { error = "Podaj login, hasło, imię i nazwisko. Login, imię i nazwisko mogą mieć maksymalnie 100 znaków." });
        }

        var konto = new Konto
        {
            Login = request.Login.Trim(),
            Imie = request.Imie.Trim(),
            Nazwisko = request.Nazwisko.Trim()
        };
        konto.Haslo = new PasswordHasher<Konto>().HashPassword(konto, request.Haslo);
        db.Konta.Add(konto);

        try
        {
            await db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: "23505" })
        {
            return Conflict(new { error = "Ten login jest już zajęty." });
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException)
        {
            return StatusCode(500, new { error = "Błąd bazy danych." });
        }

        return Created($"/konta/{konto.Id}/saldo", new { konto.Id, konto.Login, konto.Imie, konto.Nazwisko });
    }




    // Dodaje podaną kwotę do salda PLN użytkownika.
    [HttpPost("{id:long}/doladowanie")]
    public async Task<IActionResult> DoladujKonto(long id, [FromBody] DoladujSaldo request)
    {
        if (!KwotaValidator.PoprawnaKwota(request.Kwota))
            return BadRequest(new { error = "Kwota musi być dodatnia, mieć najwyżej 2 miejsca po przecinku." });

        try
        {
            var zmienione = await db.Konta.Where(k => k.Id == id)
                .ExecuteUpdateAsync(s => s.SetProperty(k => k.AktualneSaldoPln, k => k.AktualneSaldoPln + request.Kwota));

            return zmienione == 0
                ? NotFound(new { error = "Konto nie istnieje." })
                : Ok(new { message = "Saldo PLN zostało doładowane." });
        }
        catch (PostgresException)
        {
            return StatusCode(500, new { error = "Błąd bazy danych." });
        }
    }




    // Pobiera przelewy wysłane i odebrane przez użytkownika.
    [HttpGet("{id:long}/historia-przelewow")]
    public async Task<IActionResult> PobierzHistoriePrzelewow(long id)
    {
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
    [HttpGet("{id:long}/historia-przewalutowania")]
    public async Task<IActionResult> PobierzHistoriePrzewalutowania(long id)
    {
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




    // Odświeża kursy NBP i wymienia PLN na EUR/USD lub odwrotnie.
    [HttpPost("{id:long}/przewalutowanie")]
    public async Task<IActionResult> PrzewalutujKonto(long id, [FromBody] PrzewalutujSaldo request,
        CancellationToken cancellationToken)
    {
        var waluta = request.Waluta?.Trim().ToUpperInvariant();

        var typ = request.TypTransakcji?.Trim().ToUpperInvariant();

        if (id <= 0)
        {
            return BadRequest(new { error = "Podaj konto na którym ma zostać wykonanie przewalutowania" });
        }

        if (!KwotaValidator.PoprawnaKwota(request.Kwota))
        {
            return BadRequest(new { error = "dodatnią kwotę EUR/USD z najwyżej 2 miejscami po przecinku" });
        }

        if (waluta is not ("EUR" or "USD"))
        {
            return BadRequest(new { error = "W walucie musi być wpisana kwota EURO albo USD" });
        }

        if (typ is not ("ZAKUP" or "SPRZEDAZ"))
        {
            return BadRequest(new { error = "Podaj typ przewalutowania ZAKUP lub SPRZEDAZ" });
        }

        try
        {
            // Najpierw zapisuje najnowsze kursy, dopiero potem wykonuje wymianę.
            await nbp.AktualizujAktualneKursy(cancellationToken);

            // Kwota oznacza ilość EUR/USD. ZAKUP i SPRZEDAZ są z perspektywy użytkownika.
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

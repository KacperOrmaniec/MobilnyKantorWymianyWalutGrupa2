using Kantor.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kantor.Api.Controllers;

[ApiController]
[Authorize]
[Route("konta")]
public class TransakcjeController(KantorDbContext db) : ControllerBase
{
    // Jeden wpis wspólnej historii (pola z pkt 4 wymagań).
    public record Transakcja(
        long Id,
        string Rodzaj,
        string WalutaZrodlowa,
        string WalutaDocelowa,
        decimal Kwota,
        decimal? KwotaDocelowa,
        decimal? Kurs,
        DateTime Data,
        string? Kontrahent);

    // Zwraca przelewy, przewalutowania i doładowania zalogowanego użytkownika w jednej liście, od najnowszych.
    // ponytail: 3 zapytania + sortowanie w pamięci, wczytuje całą historię konta;
    // przy dużej liczbie wpisów dodać paginację (?od=&limit=) albo UNION ALL w SQL.
    [HttpGet("me/transakcje")]
    public async Task<IActionResult> PobierzTransakcje()
    {
        var id = User.IdKonta();
        if (!await db.Konta.AnyAsync(k => k.Id == id))
            return NotFound(new { error = "Konto nie istnieje." });

        var przelewy = await db.HistoriaPrzelewóws.AsNoTracking()
            .Where(p => p.IdNadawcy == id || p.IdOdbiorcy == id)
            .Select(p => new Transakcja(
                p.Id,
                p.IdNadawcy == id ? "PRZELEW_WYCHODZACY" : "PRZELEW_PRZYCHODZACY",
                p.Waluta,
                p.Waluta,
                p.Kwota,
                null,
                null,
                p.Timestamp,
                p.IdNadawcy == id
                    ? p.IdOdbiorcyNavigation.Imie + " " + p.IdOdbiorcyNavigation.Nazwisko
                    : p.IdNadawcyNavigation.Imie + " " + p.IdNadawcyNavigation.Nazwisko))
            .ToListAsync();

        // ZAKUP = użytkownik płaci PLN, SPRZEDAZ = otrzymuje PLN.
        var wymiany = await db.HistoriaPrzewalutowania.AsNoTracking()
            .Where(p => p.IdKonta == id)
            .Select(p => new Transakcja(
                p.Id,
                p.WalutaSprzedana == "PLN" ? "ZAKUP" : "SPRZEDAZ",
                p.WalutaSprzedana,
                p.WalutaKupiona,
                p.KwotaSprzedana,
                p.KwotaKupiona,
                p.KursPrzewalutowania,
                p.Timestamp,
                null))
            .ToListAsync();

        var doladowania = await db.HistoriaDoladowans.AsNoTracking()
            .Where(d => d.IdKonta == id)
            .Select(d => new Transakcja(d.Id, "DOLADOWANIE", d.Waluta, d.Waluta, d.Kwota, null, null, d.Timestamp, null))
            .ToListAsync();

        var transakcje = przelewy.Concat(wymiany).Concat(doladowania)
            .OrderByDescending(t => t.Data)
            .ToList();

        return Ok(transakcje);
    }
}

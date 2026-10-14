using System.Net;
using Kantor.Api.Data;
using Kantor.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Kantor.Api.Services;

public class NbpService(HttpClient client, KantorDbContext db)
{
    // Waluty obce z tabeli waluty (PLN jest walutą rozliczeniową, NBP go nie notuje).
    private Task<List<string>> PobierzWaluty(CancellationToken cancellationToken) =>
        db.Waluty.Where(w => w.Kod != "PLN").Select(w => w.Kod).ToListAsync(cancellationToken);

    // Pobiera wszystkie kursy przed zapisem, żeby błąd NBP nie zostawił połowy aktualizacji.
    public async Task AktualizujAktualneKursy(CancellationToken cancellationToken)
    {
        var waluty = await PobierzWaluty(cancellationToken);
        var odpowiedzi = await Task.WhenAll(waluty.Select(waluta =>
            PobierzKursy($"exchangerates/rates/C/{waluta}/?format=json", waluta, "C", cancellationToken)));

        foreach (var odpowiedz in odpowiedzi)
        {
            if (odpowiedz.Rates.Count != 1 || odpowiedz.Rates[0].Bid is not > 0 || odpowiedz.Rates[0].Ask is not > 0)
                throw new HttpRequestException("Nieprawidłowe kursy w odpowiedzi NBP.");
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        foreach (var odpowiedz in odpowiedzi)
        {
            var kurs = odpowiedz.Rates[0];
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"CALL public.zmiana_aktualnego_kursu_walut({odpowiedz.Code}::varchar, {kurs.Bid!.Value}, {kurs.Ask!.Value}, NULL)",
                cancellationToken);
        }
        await transaction.CommitAsync(cancellationToken);
    }

    // Uzupełnia kursy średnie z ostatnich 7 dni, bez duplikowania waluty i daty.
    public async Task AktualizujHistoryczneKursy(CancellationToken cancellationToken)
    {
        var czasPolski = TimeZoneInfo.ConvertTimeBySystemTimeZoneId(DateTimeOffset.UtcNow, "Europe/Warsaw");
        var doDaty = DateOnly.FromDateTime(czasPolski.DateTime);
        var odDaty = doDaty.AddDays(-6);
        var waluty = await PobierzWaluty(cancellationToken);
        var odpowiedzi = await Task.WhenAll(waluty.Select(waluta =>
            PobierzKursy($"exchangerates/rates/A/{waluta}/{odDaty:yyyy-MM-dd}/{doDaty:yyyy-MM-dd}/?format=json",
                waluta, "A", cancellationToken, brakDanychDozwolony: true)));

        foreach (var odpowiedz in odpowiedzi)
        {
            if (odpowiedz.Rates.Any(k => k.Mid is not > 0 || k.EffectiveDate < odDaty || k.EffectiveDate > doDaty))
                throw new HttpRequestException("Nieprawidłowe kursy w odpowiedzi NBP.");
        }

        await using var transaction = await db.Database.BeginTransactionAsync(cancellationToken);
        foreach (var odpowiedz in odpowiedzi)
        {
            foreach (var kurs in odpowiedz.Rates.OrderBy(k => k.EffectiveDate))
            {
                await db.Database.ExecuteSqlInterpolatedAsync($"""
                    INSERT INTO public.historyczne_kursy_walut (waluta, data, kurs_avg)
                    VALUES ({odpowiedz.Code}, {kurs.EffectiveDate}, {kurs.Mid!.Value})
                    ON CONFLICT (waluta, data) DO UPDATE SET kurs_avg = EXCLUDED.kurs_avg
                    """, cancellationToken);
            }
        }
        await transaction.CommitAsync(cancellationToken);
    }

    private async Task<NbpOdpowiedzDTO> PobierzKursy(string adres, string waluta, string tabela,
        CancellationToken cancellationToken, bool brakDanychDozwolony = false)
    {
        using var response = await client.GetAsync(adres, cancellationToken);

        if (brakDanychDozwolony && response.StatusCode == HttpStatusCode.NotFound)
            return new NbpOdpowiedzDTO { Code = waluta, Table = tabela };

        response.EnsureSuccessStatusCode();
        var odpowiedz = await response.Content.ReadFromJsonAsync<NbpOdpowiedzDTO>(cancellationToken);
        if (odpowiedz is null || odpowiedz.Code != waluta || odpowiedz.Table != tabela || odpowiedz.Rates is null)
            throw new HttpRequestException("Nieprawidłowa odpowiedź NBP.");

        return odpowiedz;
    }
}


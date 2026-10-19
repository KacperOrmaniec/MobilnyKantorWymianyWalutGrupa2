using Npgsql;

namespace Kantor.Api.Tests;

// Triggery alertów kursowych; każdy test w transakcji wycofywanej na końcu.
public sealed class AlertyTests : IAsyncLifetime
{
    private NpgsqlConnection polaczenie = null!;
    private NpgsqlTransaction transakcja = null!;

    public async Task InitializeAsync()
    {
        polaczenie = new NpgsqlConnection(BazaFactAttribute.Polaczenie);
        await polaczenie.OpenAsync();
        transakcja = await polaczenie.BeginTransactionAsync();
    }

    public async Task DisposeAsync()
    {
        await transakcja.RollbackAsync();
        await polaczenie.DisposeAsync();
    }

    [BazaFact]
    public async Task ZmianaKursu_OznaczaTylkoAlertyZOsiagnietymProgiem()
    {
        await Wykonaj("CALL public.zmiana_aktualnego_kursu_walut('EUR', 4.2, 4.4, NULL)");
        var konto = await NoweKonto();
        var zakup = await NowyAlert(konto, "ZAKUP", 4.3m);         // czeka na kurs sprzedaży <= 4.3
        var sprzedaz = await NowyAlert(konto, "SPRZEDAZ", 4.25m);  // czeka na kurs zakupu >= 4.25
        Assert.Null(await Spelnienie(zakup));
        Assert.Null(await Spelnienie(sprzedaz));

        // Sprzedaż spada do progu ZAKUP, zakup nie dochodzi do progu SPRZEDAZ.
        await Wykonaj("CALL public.zmiana_aktualnego_kursu_walut('EUR', 4.1, 4.3, NULL)");

        Assert.Equal(4.3m, await Spelnienie(zakup));
        Assert.Null(await Spelnienie(sprzedaz));

        // Alert jednorazowy: dalsza zmiana kursu nie nadpisuje spełnienia.
        await Wykonaj("CALL public.zmiana_aktualnego_kursu_walut('EUR', 4.3, 4.2, NULL)");

        Assert.Equal(4.3m, await Spelnienie(zakup));
        Assert.Equal(4.3m, await Spelnienie(sprzedaz));
    }

    [BazaFact]
    public async Task NowyAlert_JuzSpelniony_OznaczonyPrzyTworzeniu()
    {
        await Wykonaj("CALL public.zmiana_aktualnego_kursu_walut('USD', 3.9, 4.0, NULL)");
        var konto = await NoweKonto();

        Assert.Equal(4.0m, await Spelnienie(await NowyAlert(konto, "ZAKUP", 4.1m, "USD")));
        Assert.Null(await Spelnienie(await NowyAlert(konto, "SPRZEDAZ", 4.0m, "USD")));
    }

    private async Task<long> NoweKonto() =>
        (long)(await Skalar($"""
            INSERT INTO public.konta (login, haslo, "Imie", "Nazwisko")
            VALUES ('test_{Guid.NewGuid():N}', 'x', 'Test', 'Testowy') RETURNING id
            """))!;

    private async Task<long> NowyAlert(long konto, string typ, decimal prog, string waluta = "EUR")
    {
        await using var cmd = new NpgsqlCommand(
            "INSERT INTO public.alerty_kursowe (id_konta, waluta, typ, prog) VALUES (@k, @w, @t, @p) RETURNING id",
            polaczenie, transakcja);
        cmd.Parameters.AddWithValue("k", konto);
        cmd.Parameters.AddWithValue("w", waluta);
        cmd.Parameters.AddWithValue("t", typ);
        cmd.Parameters.AddWithValue("p", prog);
        return (long)(await cmd.ExecuteScalarAsync())!;
    }

    // Kurs spełnienia alertu albo null, gdy niespełniony (sprawdza też spójność z kolumną spelniono).
    private async Task<decimal?> Spelnienie(long alert)
    {
        await using var cmd = new NpgsqlCommand(
            $"SELECT spelniono IS NOT NULL, kurs_spelnienia FROM public.alerty_kursowe WHERE id = {alert}", polaczenie, transakcja);
        await using var r = await cmd.ExecuteReaderAsync();
        await r.ReadAsync();
        var kurs = r.IsDBNull(1) ? (decimal?)null : r.GetDecimal(1);
        Assert.Equal(r.GetBoolean(0), kurs is not null);
        return kurs;
    }

    private async Task Wykonaj(string sql)
    {
        await using var cmd = new NpgsqlCommand(sql, polaczenie, transakcja);
        await cmd.ExecuteNonQueryAsync();
    }

    private async Task<object?> Skalar(string sql)
    {
        await using var cmd = new NpgsqlCommand(sql, polaczenie, transakcja);
        return await cmd.ExecuteScalarAsync();
    }
}

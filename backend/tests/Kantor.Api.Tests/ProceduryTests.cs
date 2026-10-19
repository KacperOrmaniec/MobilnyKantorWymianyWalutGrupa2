using Npgsql;

namespace Kantor.Api.Tests;

// Test na prawdziwej bazie; pomijany, gdy nie ustawiono KANTOR_TEST_DB.
public sealed class BazaFactAttribute : FactAttribute
{
    public static readonly string? Polaczenie = Environment.GetEnvironmentVariable("KANTOR_TEST_DB");

    public BazaFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Polaczenie))
            Skip = "Ustaw KANTOR_TEST_DB (connection string do bazy kantor), aby uruchomić testy procedur.";
    }
}

// Każdy test działa w transakcji wycofywanej na końcu, więc baza zostaje bez zmian.
public sealed class ProceduryTests : IAsyncLifetime
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
    public async Task Przelew_ZmieniaObaSaldaIZapisujeHistorie()
    {
        var nadawca = await NoweKonto(("PLN", 100m));
        var odbiorca = await NoweKonto();

        await Wykonaj($"CALL public.przelew({nadawca}, {odbiorca}, 30.50, ' pln ')");

        Assert.Equal(69.50m, await Saldo(nadawca, "PLN"));
        Assert.Equal(30.50m, await Saldo(odbiorca, "PLN"));
        Assert.Equal(1L, await Skalar($"""
            SELECT COUNT(*) FROM public."historia_przelewów"
            WHERE id_nadawcy = {nadawca} AND id_odbiorcy = {odbiorca} AND "Kwota" = 30.50 AND "Waluta" = 'PLN'
            """));
    }

    [BazaFact]
    public async Task Przelew_BrakSrodkow_RzucaP0001ISaldaBezZmian()
    {
        var nadawca = await NoweKonto(("EUR", 10m));
        var odbiorca = await NoweKonto(("EUR", 5m));

        await OczekujP0001($"CALL public.przelew({nadawca}, {odbiorca}, 20, 'EUR')");

        Assert.Equal(10m, await Saldo(nadawca, "EUR"));
        Assert.Equal(5m, await Saldo(odbiorca, "EUR"));
        Assert.Equal(0L, await Skalar($"""SELECT COUNT(*) FROM public."historia_przelewów" WHERE id_nadawcy = {nadawca}"""));
    }

    [BazaFact]
    public async Task Przewalutowanie_Zakup_PobieraPlnPoKursieSprzedazy()
    {
        await Wykonaj("CALL public.zmiana_aktualnego_kursu_walut('EUR', 4.0, 4.3333, NULL)");
        var konto = await NoweKonto(("PLN", 100m));

        await Wykonaj($"CALL public.przewalutowanie({konto}, 'EUR', 10, 'ZAKUP')");

        // 10 * 4.3333 = 43.333 -> 43.33 PLN
        Assert.Equal(56.67m, await Saldo(konto, "PLN"));
        Assert.Equal(10m, await Saldo(konto, "EUR"));
        Assert.Equal(1L, await Skalar($"""
            SELECT COUNT(*) FROM public.historia_przewalutowania
            WHERE id_konta = {konto} AND "Kurs_przewalutowania" = 4.3333
              AND "Waluta_sprzedana" = 'PLN' AND "Kwota_sprzedana" = 43.33
              AND "Waluta_kupiona" = 'EUR' AND "Kwota_kupiona" = 10
            """));
    }

    [BazaFact]
    public async Task Przewalutowanie_Sprzedaz_WyplacaPlnPoKursieZakupu()
    {
        await Wykonaj("CALL public.zmiana_aktualnego_kursu_walut('EUR', 4.1234, 4.5, NULL)");
        var konto = await NoweKonto(("EUR", 20m));

        await Wykonaj($"CALL public.przewalutowanie({konto}, 'EUR', 10.5, 'SPRZEDAZ')");

        // 10.5 * 4.1234 = 43.2957 -> 43.30 PLN
        Assert.Equal(9.50m, await Saldo(konto, "EUR"));
        Assert.Equal(43.30m, await Saldo(konto, "PLN"));
        Assert.Equal(1L, await Skalar($"""
            SELECT COUNT(*) FROM public.historia_przewalutowania
            WHERE id_konta = {konto} AND "Kurs_przewalutowania" = 4.1234
              AND "Waluta_sprzedana" = 'EUR' AND "Kwota_sprzedana" = 10.5
              AND "Waluta_kupiona" = 'PLN' AND "Kwota_kupiona" = 43.30
            """));
    }

    [BazaFact]
    public async Task Przewalutowanie_NieobslugiwanaWaluta_RzucaP0001()
    {
        var konto = await NoweKonto(("PLN", 100m));

        foreach (var waluta in new[] { "XYZ", "PLN" })
            await OczekujP0001($"CALL public.przewalutowanie({konto}, '{waluta}', 10, 'ZAKUP')");

        Assert.Equal(100m, await Saldo(konto, "PLN"));
    }

    // Tworzy konto z unikalnym loginem i podanymi saldami, zwraca jego id.
    private async Task<long> NoweKonto(params (string Waluta, decimal Kwota)[] salda)
    {
        var id = (long)(await Skalar($"""
            INSERT INTO public.konta (login, haslo, "Imie", "Nazwisko")
            VALUES ('test_{Guid.NewGuid():N}', 'x', 'Test', 'Testowy') RETURNING id
            """))!;
        foreach (var (waluta, kwota) in salda)
        {
            await using var cmd = new NpgsqlCommand(
                "INSERT INTO public.salda (id_konta, waluta, saldo) VALUES (@id, @waluta, @kwota)", polaczenie, transakcja);
            cmd.Parameters.AddWithValue("id", id);
            cmd.Parameters.AddWithValue("waluta", waluta);
            cmd.Parameters.AddWithValue("kwota", kwota);
            await cmd.ExecuteNonQueryAsync();
        }
        return id;
    }

    private async Task<decimal> Saldo(long idKonta, string waluta) =>
        (decimal)(await Skalar($"SELECT COALESCE((SELECT saldo FROM public.salda WHERE id_konta = {idKonta} AND waluta = '{waluta}'), 0)"))!;

    // Oczekuje błędu procedury (RAISE EXCEPTION) i wraca do stanu sprzed wywołania.
    private async Task OczekujP0001(string sql)
    {
        await transakcja.SaveAsync("przed");
        var ex = await Assert.ThrowsAsync<PostgresException>(() => Wykonaj(sql));
        Assert.Equal("P0001", ex.SqlState);
        await transakcja.RollbackAsync("przed");
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

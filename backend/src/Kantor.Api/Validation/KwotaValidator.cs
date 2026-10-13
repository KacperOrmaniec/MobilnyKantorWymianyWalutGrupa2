namespace Kantor.Api.Validation;

public static class KwotaValidator
{
    // Sprawdza dodatnią kwotę, limit i maksymalnie dwa miejsca po przecinku.
    public static bool PoprawnaKwota(decimal kwota) =>
        kwota > 0 &&
        kwota <= 9999999999999999.99m &&
        kwota == decimal.Round(kwota, 2);
}

namespace Kantor.Api.Models;

public record DodajUzytkownika(string? Login, string? Haslo, string? Imie, string? Nazwisko);

public record ZalogujUzytkownika(string? Login, string? Haslo);

public record DoladujSaldo(decimal Kwota);

public record ZrobPrzelew(string? LoginOdbiorcy, decimal Kwota, string Waluta);

public record PrzewalutujSaldo(string Waluta, decimal Kwota, string TypTransakcji);

public record DodajAlert(string? Waluta, string? Typ, decimal Prog);

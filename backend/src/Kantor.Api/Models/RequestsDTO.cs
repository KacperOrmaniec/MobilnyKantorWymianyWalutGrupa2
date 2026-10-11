namespace Kantor.Api.Models;

public record DodajUzytkownika(string Login, string Haslo, string Imie, string Nazwisko);

public record DoladujSaldo(decimal Kwota);

public record ZrobPrzelew(long IdNadawcy, long IdOdbiorcy, decimal Kwota, string Waluta);

public record PrzewalutujSaldo(string Waluta, decimal Kwota, string TypTransakcji);

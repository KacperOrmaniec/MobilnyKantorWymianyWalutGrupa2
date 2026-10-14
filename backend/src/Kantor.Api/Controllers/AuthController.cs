using System.Security.Claims;
using System.Text;
using System.Text.RegularExpressions;
using Kantor.Api.Data;
using Kantor.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Tokens;
using Npgsql;

namespace Kantor.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(KantorDbContext db, IConfiguration config) : ControllerBase
{
    // Rejestruje użytkownika i zapisuje hash hasła.
    [HttpPost("register")]
    public async Task<IActionResult> Zarejestruj([FromBody] DodajUzytkownika request)
    {
        var login = request.Login?.Trim() ?? "";
        var imie = request.Imie?.Trim() ?? "";
        var nazwisko = request.Nazwisko?.Trim() ?? "";

        if (!Regex.IsMatch(login, "^[a-zA-Z0-9._-]{3,100}$"))
            return BadRequest(new { error = "Login musi mieć od 3 do 100 znaków: litery bez polskich znaków, cyfry, kropka, myślnik lub podkreślnik." });
        if (request.Haslo is null || request.Haslo.Length < 8)
            return BadRequest(new { error = "Hasło musi mieć co najmniej 8 znaków." });
        if (imie.Length is 0 or > 100 || nazwisko.Length is 0 or > 100)
            return BadRequest(new { error = "Podaj imię i nazwisko (maksymalnie 100 znaków każde)." });

        var konto = new Konto { Login = login, Imie = imie, Nazwisko = nazwisko };
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

        return Created("/konta/me", new { konto.Id, konto.Login, konto.Imie, konto.Nazwisko });
    }

    // Sprawdza login i hasło, zwraca token JWT ważny 60 minut.
    [HttpPost("login")]
    public async Task<IActionResult> Zaloguj([FromBody] ZalogujUzytkownika request)
    {
        var login = request.Login?.Trim();
        var konto = await db.Konta.AsNoTracking().FirstOrDefaultAsync(k => k.Login == login);

        if (konto is null || request.Haslo is null || !PoprawneHaslo(konto, request.Haslo))
            return Unauthorized(new { error = "Nieprawidłowy login lub hasło." });

        var wygasa = DateTime.UtcNow.AddMinutes(60);
        var token = new JsonWebTokenHandler().CreateToken(new SecurityTokenDescriptor
        {
            Claims = new Dictionary<string, object>
            {
                [JwtRegisteredClaimNames.Sub] = konto.Id.ToString(),
                [JwtRegisteredClaimNames.UniqueName] = konto.Login
            },
            Expires = wygasa,
            SigningCredentials = new SigningCredentials(
                new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!)), SecurityAlgorithms.HmacSha256)
        });

        return Ok(new { token, wygasa });
    }

    // Weryfikuje hasło; hash w złym formacie (np. jawne hasło w bazie) traktuje jak złe hasło.
    private static bool PoprawneHaslo(Konto konto, string haslo)
    {
        try
        {
            return new PasswordHasher<Konto>().VerifyHashedPassword(konto, konto.Haslo, haslo) != PasswordVerificationResult.Failed;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}

public static class KontoZTokena
{
    // Id zalogowanego konta z claimu "sub" tokena.
    public static long IdKonta(this ClaimsPrincipal user) =>
        long.Parse(user.FindFirstValue(JwtRegisteredClaimNames.Sub)!);
}

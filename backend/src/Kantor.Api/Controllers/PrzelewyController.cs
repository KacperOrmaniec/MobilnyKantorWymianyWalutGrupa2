using Kantor.Api.Models;
using Kantor.Api.Validation;
using Npgsql;
using Kantor.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kantor.Api.Controllers;

[ApiController]
[Authorize]
[Route("przelewy")]
public class PrzelewyController(KantorDbContext db) : ControllerBase
{
    // Wykonuje przelew od zalogowanego użytkownika do konta o podanym loginie przez procedurę przelew.
    [HttpPost]
    public async Task<IActionResult> WykonajPrzelew([FromBody] ZrobPrzelew request)
    {
        var idNadawcy = User.IdKonta();
        var waluta = request.Waluta?.Trim().ToUpperInvariant();
        if (!KwotaValidator.PoprawnaKwota(request.Kwota) || waluta is null ||
            !await db.Waluty.AnyAsync(w => w.Kod == waluta))
        {
            return BadRequest(new { error = "Podaj dodatnią kwotę z najwyżej 2 miejscami po przecinku oraz obsługiwaną walutę." });
        }

        var loginOdbiorcy = request.LoginOdbiorcy?.Trim();
        var idOdbiorcy = await db.Konta.Where(k => k.Login == loginOdbiorcy).Select(k => (long?)k.Id).FirstOrDefaultAsync();
        if (idOdbiorcy is null)
            return NotFound(new { error = "Odbiorca o podanym loginie nie istnieje." });
        if (idOdbiorcy == idNadawcy)
            return BadRequest(new { error = "Nie można wykonać przelewu do siebie." });

        try
        {
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"CALL public.przelew({idNadawcy}, {idOdbiorcy}, {request.Kwota}, {waluta}::varchar)");
            return Ok(new { message = "Przelew wykonany." });
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

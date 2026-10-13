using Kantor.Api.Models;
using Kantor.Api.Validation;
using Npgsql;
using Kantor.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kantor.Api.Controllers;

[ApiController]
[Route("przelewy")]
public class PrzelewyController(KantorDbContext db) : ControllerBase
{
    // Wykonuje przelew między kontami przez procedurę przelew.
    [HttpPost]
    public async Task<IActionResult> WykonajPrzelew([FromBody] ZrobPrzelew request)
    {
        var waluta = request.Waluta?.Trim().ToUpperInvariant();
        if (!KwotaValidator.PoprawnaKwota(request.Kwota) || waluta is not ("PLN" or "EUR" or "USD") ||
            request.IdNadawcy <= 0 || request.IdOdbiorcy <= 0 || request.IdNadawcy == request.IdOdbiorcy)
        {
            return BadRequest(new { error = "Podaj dwa różne konta, dodatnią kwotę z najwyżej 2 miejscami po przecinku oraz walutę PLN, EUR lub USD." });
        }

        try
        {
            await db.Database.ExecuteSqlInterpolatedAsync(
                $"CALL public.przelew({request.IdNadawcy}, {request.IdOdbiorcy}, {request.Kwota}, {waluta}::varchar)");
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

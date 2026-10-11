using Kantor.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Kantor.Api.Controllers;

[ApiController]
[Route("")]
public class StatusController(KantorDbContext db) : ControllerBase
{
    // Sprawdza, czy API działa.
    [HttpGet("test")]
    public IActionResult SprawdzApi() => Ok(new { status = "ok" });

    // Sprawdza połączenie z bazą danych.
    [HttpGet("testdb")]
    public async Task<IActionResult> SprawdzBaze()
    {
        bool connected = await db.Database.CanConnectAsync();

        return Ok(new { connected });
    }
}

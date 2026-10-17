using Kantor.Api.Data;
using System.Text;
using System.Text.Json;
using Kantor.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Npgsql;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Kantor.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Zły JSON lub zły typ pola: zamiast ProblemDetails ten sam kształt { error } co reszta API.
        builder.Services.AddControllers().ConfigureApiBehaviorOptions(o =>
            o.InvalidModelStateResponseFactory = _ => new BadRequestObjectResult(
                new { error = "Nieprawidłowe dane żądania. Sprawdź format JSON i typy pól." }));
        builder.Services.AddOpenApi();
        builder.Services.AddHttpClient<NbpService>(client =>
        {
            client.BaseAddress = new Uri(builder.Configuration["Nbp:Adres"] ?? "https://api.nbp.pl/api/");
            client.Timeout = TimeSpan.FromSeconds(15);
        });
        builder.Services.AddHostedService<OdswiezanieKursow>();

        builder.Services.AddDbContext<KantorDbContext>(options =>
            options.UseNpgsql(
                builder.Configuration.GetConnectionString("KantorDb")));

        // Klucz JWT z User Secrets lub zmiennej Jwt__Key; bez niego API nie startuje.
        var jwtKey = builder.Configuration["Jwt:Key"];
        if (string.IsNullOrEmpty(jwtKey) || jwtKey.Length < 32)
            throw new InvalidOperationException(
                "Brak klucza JWT lub jest za krótki. Ustaw 'Jwt:Key' (min. 32 znaki) w User Secrets albo zmienną środowiskową Jwt__Key.");

        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.MapInboundClaims = false; // claim "sub" zostaje pod swoją nazwą
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey))
                };
                // Domyślny 401 ma puste body; mobile oczekuje { error }.
                options.Events = new JwtBearerEvents
                {
                    OnChallenge = async context =>
                    {
                        context.HandleResponse();
                        context.Response.StatusCode = 401;
                        context.Response.Headers.WWWAuthenticate = "Bearer";
                        await context.Response.WriteAsJsonAsync(
                            new { error = "Brak lub nieprawidłowy token. Zaloguj się ponownie." });
                    }
                };
            });
        builder.Services.AddAuthorization();

        var app = builder.Build();

        // Jedno miejsce obsługi wyjątków z kontrolerów; logujemy sami tylko nieoczekiwane 500.
        app.UseExceptionHandler(new ExceptionHandlerOptions
        {
            SuppressDiagnosticsCallback = _ => true,
            ExceptionHandler = async context =>
            {
                var ex = context.Features.Get<IExceptionHandlerFeature>()!.Error;
                var (kod, error) = MapujBlad(ex, context);
                if (kod == 500)
                    app.Logger.LogError(ex, "Błąd przy {Metoda} {Sciezka}", context.Request.Method, context.Request.Path);
                context.Response.StatusCode = kod;
                await context.Response.WriteAsJsonAsync(new { error });
            }
        });

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();

        app.Run();
    }

    // Wyjątek -> (kod HTTP, komunikat dla klienta); bez szczegółów technicznych w odpowiedzi.
    private static (int, string) MapujBlad(Exception ex, HttpContext context)
    {
        // EF/Npgsql często opakowują błąd bazy (DbUpdateException, InvalidOperationException).
        var lancuch = new List<Exception>();
        for (var e = ex; e is not null; e = e.InnerException) lancuch.Add(e);
        var pg = lancuch.OfType<PostgresException>().FirstOrDefault();

        return ex switch
        {
            HttpRequestException or JsonException => (502, "Nie udało się pobrać kursów z NBP."),
            OperationCanceledException when !context.RequestAborted.IsCancellationRequested
                => (504, "Przekroczono czas oczekiwania na NBP."),
            _ when pg?.SqlState == "P0001" => (400, pg.MessageText), // komunikat procedury
            _ when lancuch.Any(e => e is NpgsqlException) => (500, "Błąd bazy danych."),
            _ => (500, "Wewnętrzny błąd serwera.")
        };
    }
}

using Kantor.Api.Data;
using System.Text;
using Kantor.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace Kantor.Api;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        builder.Services.AddControllers();
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
            });
        builder.Services.AddAuthorization();

        var app = builder.Build();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.UseAuthentication();
        app.UseAuthorization();
        app.MapControllers();

        app.Run();
    }
}

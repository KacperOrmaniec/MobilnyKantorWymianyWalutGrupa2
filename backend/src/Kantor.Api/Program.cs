using Kantor.Api.Data;
using Kantor.Api.Services;
using Microsoft.EntityFrameworkCore;

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
            client.BaseAddress = new Uri("https://api.nbp.pl/api/");
            client.Timeout = TimeSpan.FromSeconds(15);
        });

        builder.Services.AddDbContext<KantorDbContext>(options =>
            options.UseNpgsql(
                builder.Configuration.GetConnectionString("KantorDb")));

        var app = builder.Build();

        if (app.Environment.IsDevelopment())
        {
            app.MapOpenApi();
        }

        app.MapControllers();

        app.Run();
    }
}

namespace Kantor.Api.Services;

// Odświeża aktualne kursy z NBP od razu po starcie i potem co Kursy:OdswiezanieMinuty (domyślnie 15).
public class OdswiezanieKursow(IServiceScopeFactory scopeFactory, IConfiguration config,
    ILogger<OdswiezanieKursow> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        // Wartość <= 0 wywaliłaby PeriodicTimer (i całą aplikację), więc wtedy domyślne 15.
        using var timer = new PeriodicTimer(TimeSpan.FromMinutes(
            config.GetValue("Kursy:OdswiezanieMinuty", 15) is > 0 and var minuty ? minuty : 15));
        do
        {
            try
            {
                // NbpService i DbContext są scoped, więc nowy scope na każde odświeżenie.
                using var scope = scopeFactory.CreateScope();
                await scope.ServiceProvider.GetRequiredService<NbpService>().AktualizujAktualneKursy(stoppingToken);
                logger.LogInformation("Odświeżono kursy z NBP.");
            }
            catch (Exception ex) when (!stoppingToken.IsCancellationRequested)
            {
                logger.LogWarning(ex, "Nie udało się odświeżyć kursów z NBP. Zostają ostatnie kursy z bazy.");
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}

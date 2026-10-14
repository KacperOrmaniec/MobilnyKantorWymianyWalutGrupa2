namespace Kantor.Api.Models;

public partial class AlertKursowy
{
    public long Id { get; set; }

    public long IdKonta { get; set; }

    public string Waluta { get; set; } = null!;

    public string Typ { get; set; } = null!;

    public decimal Prog { get; set; }

    public DateTime Utworzono { get; set; }

    public DateTime? Spelniono { get; set; }

    public decimal? KursSpelnienia { get; set; }
}

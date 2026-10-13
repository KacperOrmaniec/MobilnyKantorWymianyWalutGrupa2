namespace Kantor.Api.Models;

public class NbpOdpowiedzDTO
{
    public string Code { get; set; } = "";
    public string Table { get; set; } = "";
    public List<NbpKursDTO> Rates { get; set; } = [];
}

public class NbpKursDTO
{
    public DateOnly EffectiveDate { get; set; }
    public decimal? Bid { get; set; }
    public decimal? Ask { get; set; }
    public decimal? Mid { get; set; }
}

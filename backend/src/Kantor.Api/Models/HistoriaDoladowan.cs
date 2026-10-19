using System;
using System.Collections.Generic;

namespace Kantor.Api.Models;

public partial class HistoriaDoladowan
{
    public long Id { get; set; }

    public DateTime Timestamp { get; set; }

    public long IdKonta { get; set; }

    public decimal Kwota { get; set; }

    public string Waluta { get; set; } = null!;

    public virtual Konto IdKontaNavigation { get; set; } = null!;
}

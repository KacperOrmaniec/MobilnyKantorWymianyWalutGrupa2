using System;
using System.Collections.Generic;

namespace Kantor.Api.Models;

public partial class HistoriaPrzelewów
{
    public long Id { get; set; }

    public DateTime Timestamp { get; set; }

    public long IdNadawcy { get; set; }

    public long IdOdbiorcy { get; set; }

    public decimal Kwota { get; set; }

    public string Waluta { get; set; } = null!;

    public virtual Konto IdNadawcyNavigation { get; set; } = null!;

    public virtual Konto IdOdbiorcyNavigation { get; set; } = null!;
}

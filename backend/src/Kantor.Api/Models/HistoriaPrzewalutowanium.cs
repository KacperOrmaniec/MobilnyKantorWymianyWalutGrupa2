using System;
using System.Collections.Generic;

namespace Kantor.Api.Models;

public partial class HistoriaPrzewalutowanium
{
    public long Id { get; set; }

    public DateTime Timestamp { get; set; }

    public long IdKonta { get; set; }

    public decimal KursPrzewalutowania { get; set; }

    public string WalutaSprzedana { get; set; } = null!;

    public string WalutaKupiona { get; set; } = null!;

    public decimal KwotaSprzedana { get; set; }

    public decimal KwotaKupiona { get; set; }

    public virtual Konto IdKontaNavigation { get; set; } = null!;
}

using System;
using System.Collections.Generic;

namespace Kantor.Api.Models;

public partial class Saldo
{
    public long IdKonta { get; set; }

    public string Waluta { get; set; } = null!;

    public decimal Kwota { get; set; }

    public virtual Konto IdKontaNavigation { get; set; } = null!;

    public virtual Waluta WalutaNavigation { get; set; } = null!;
}

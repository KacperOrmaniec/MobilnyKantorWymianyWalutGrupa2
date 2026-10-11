using System;
using System.Collections.Generic;

namespace Kantor.Api.Models;

public partial class AktualneKursyWalut
{
    public long Id { get; set; }

    public DateTime Timestamp { get; set; }

    public string Waluta { get; set; } = null!;

    public decimal KursZakupu { get; set; }

    public decimal KursSprzedazy { get; set; }
}

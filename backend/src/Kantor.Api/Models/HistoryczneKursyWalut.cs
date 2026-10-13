using System;
using System.Collections.Generic;

namespace Kantor.Api.Models;

public partial class HistoryczneKursyWalut
{
    public long Id { get; set; }

    public string Waluta { get; set; } = null!;

    public decimal KursAvg { get; set; }

    public DateOnly Data { get; set; }
}

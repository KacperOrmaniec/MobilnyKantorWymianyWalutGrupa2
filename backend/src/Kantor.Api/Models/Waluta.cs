using System;
using System.Collections.Generic;

namespace Kantor.Api.Models;

public partial class Waluta
{
    public string Kod { get; set; } = null!;

    public string Nazwa { get; set; } = null!;

    public virtual ICollection<Saldo> Salda { get; set; } = new List<Saldo>();
}

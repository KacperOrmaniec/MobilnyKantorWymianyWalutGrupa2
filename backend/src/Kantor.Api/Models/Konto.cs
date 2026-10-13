using System;
using System.Collections.Generic;

namespace Kantor.Api.Models;

public partial class Konto
{
    public long Id { get; set; }

    public string Login { get; set; } = null!;

    public string Haslo { get; set; } = null!;

    public string Imie { get; set; } = null!;

    public string Nazwisko { get; set; } = null!;

    public decimal AktualneSaldoPln { get; set; }

    public decimal AktualneSaldoEur { get; set; }

    public decimal AktualneSaldoUsd { get; set; }

    public virtual ICollection<HistoriaPrzelewów> HistoriaPrzelewówIdNadawcyNavigations { get; set; } = new List<HistoriaPrzelewów>();

    public virtual ICollection<HistoriaPrzelewów> HistoriaPrzelewówIdOdbiorcyNavigations { get; set; } = new List<HistoriaPrzelewów>();

    public virtual ICollection<HistoriaPrzewalutowanium> HistoriaPrzewalutowania { get; set; } = new List<HistoriaPrzewalutowanium>();
}

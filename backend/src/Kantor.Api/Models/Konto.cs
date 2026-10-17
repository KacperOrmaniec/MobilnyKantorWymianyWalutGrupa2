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

    public virtual ICollection<HistoriaPrzelewów> HistoriaPrzelewówIdNadawcyNavigations { get; set; } = new List<HistoriaPrzelewów>();

    public virtual ICollection<HistoriaPrzelewów> HistoriaPrzelewówIdOdbiorcyNavigations { get; set; } = new List<HistoriaPrzelewów>();

    public virtual ICollection<HistoriaPrzewalutowanium> HistoriaPrzewalutowania { get; set; } = new List<HistoriaPrzewalutowanium>();

    public virtual ICollection<HistoriaDoladowan> HistoriaDoladowans { get; set; } = new List<HistoriaDoladowan>();

    public virtual ICollection<Saldo> Salda { get; set; } = new List<Saldo>();
}

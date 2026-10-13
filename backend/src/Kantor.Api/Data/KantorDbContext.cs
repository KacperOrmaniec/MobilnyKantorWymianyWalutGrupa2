using System;
using System.Collections.Generic;
using Kantor.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Kantor.Api.Data;

public partial class KantorDbContext : DbContext
{
    public KantorDbContext(DbContextOptions<KantorDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AktualneKursyWalut> AktualneKursyWaluts { get; set; }

    public virtual DbSet<HistoriaPrzelewów> HistoriaPrzelewóws { get; set; }

    public virtual DbSet<HistoriaPrzewalutowanium> HistoriaPrzewalutowania { get; set; }

    public virtual DbSet<HistoryczneKursyWalut> HistoryczneKursyWaluts { get; set; }

    public virtual DbSet<Konto> Konta { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AktualneKursyWalut>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Aktualne_kursy_walut_pkey");

            entity.ToTable("aktualne_kursy_walut");

            entity.HasIndex(e => e.Waluta, "Aktualne_kursy_walut_waluta_key").IsUnique();

            entity.Property(e => e.Id)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id");
            entity.Property(e => e.KursSprzedazy)
                .HasPrecision(18, 6)
                .HasColumnName("kurs_sprzedazy");
            entity.Property(e => e.KursZakupu)
                .HasPrecision(18, 6)
                .HasColumnName("kurs_zakupu");
            entity.Property(e => e.Timestamp).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Waluta)
                .HasMaxLength(10)
                .HasColumnName("waluta");
        });

        modelBuilder.Entity<HistoriaPrzelewów>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("historia_przelewów_pkey");

            entity.ToTable("historia_przelewów");

            entity.Property(e => e.Id)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id");
            entity.Property(e => e.IdNadawcy).HasColumnName("id_nadawcy");
            entity.Property(e => e.IdOdbiorcy).HasColumnName("id_odbiorcy");
            entity.Property(e => e.Kwota).HasPrecision(18, 2);
            entity.Property(e => e.Timestamp).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.Waluta).HasMaxLength(10);

            entity.HasOne(d => d.IdNadawcyNavigation).WithMany(p => p.HistoriaPrzelewówIdNadawcyNavigations)
                .HasForeignKey(d => d.IdNadawcy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("historia_przelewów_id_nadawcy_fkey");

            entity.HasOne(d => d.IdOdbiorcyNavigation).WithMany(p => p.HistoriaPrzelewówIdOdbiorcyNavigations)
                .HasForeignKey(d => d.IdOdbiorcy)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("historia_przelewów_id_odbiorcy_fkey");
        });

        modelBuilder.Entity<HistoriaPrzewalutowanium>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("historia_przewalutowania_pkey");

            entity.ToTable("historia_przewalutowania");

            entity.Property(e => e.Id)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id");
            entity.Property(e => e.IdKonta).HasColumnName("id_konta");
            entity.Property(e => e.KursPrzewalutowania)
                .HasPrecision(18, 6)
                .HasColumnName("Kurs_przewalutowania");
            entity.Property(e => e.KwotaKupiona)
                .HasPrecision(18, 2)
                .HasColumnName("Kwota_kupiona");
            entity.Property(e => e.KwotaSprzedana)
                .HasPrecision(18, 2)
                .HasColumnName("Kwota_sprzedana");
            entity.Property(e => e.Timestamp).HasDefaultValueSql("CURRENT_TIMESTAMP");
            entity.Property(e => e.WalutaKupiona)
                .HasMaxLength(10)
                .HasColumnName("Waluta_kupiona");
            entity.Property(e => e.WalutaSprzedana)
                .HasMaxLength(10)
                .HasColumnName("Waluta_sprzedana");

            entity.HasOne(d => d.IdKontaNavigation).WithMany(p => p.HistoriaPrzewalutowania)
                .HasForeignKey(d => d.IdKonta)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("historia_przewalutowania_id_konta_fkey");
        });

        modelBuilder.Entity<HistoryczneKursyWalut>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("Historyczne_kursy_walut_pkey");

            entity.ToTable("historyczne_kursy_walut");

            entity.HasIndex(e => new { e.Waluta, e.Data }, "Historyczne_kursy_walut_waluta_data_key").IsUnique();

            entity.Property(e => e.Id)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id");
            entity.Property(e => e.Data).HasColumnName("data");
            entity.Property(e => e.KursAvg)
                .HasPrecision(18, 6)
                .HasColumnName("kurs_avg");
            entity.Property(e => e.Waluta)
                .HasMaxLength(10)
                .HasColumnName("waluta");
        });

        modelBuilder.Entity<Konto>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("konta_pkey");

            entity.ToTable("konta");

            entity.HasIndex(e => e.Login, "konta_login_key").IsUnique();

            entity.Property(e => e.Id)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id");
            entity.Property(e => e.AktualneSaldoEur)
                .HasPrecision(18, 2)
                .HasColumnName("Aktualne_Saldo_EUR");
            entity.Property(e => e.AktualneSaldoPln)
                .HasPrecision(18, 2)
                .HasColumnName("Aktualne_Saldo_PLN");
            entity.Property(e => e.AktualneSaldoUsd)
                .HasPrecision(18, 2)
                .HasColumnName("Aktualne_Saldo_USD");
            entity.Property(e => e.Haslo).HasColumnName("haslo");
            entity.Property(e => e.Imie).HasMaxLength(100);
            entity.Property(e => e.Login)
                .HasMaxLength(100)
                .HasColumnName("login");
            entity.Property(e => e.Nazwisko).HasMaxLength(100);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}

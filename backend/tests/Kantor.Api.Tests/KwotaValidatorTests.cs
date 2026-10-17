using System.Globalization;
using Kantor.Api.Validation;

namespace Kantor.Api.Tests;

public class KwotaValidatorTests
{
    // decimal nie może być argumentem atrybutu, więc kwoty podajemy jako tekst.
    [Theory]
    [InlineData("0.01", true)]
    [InlineData("1", true)]
    [InlineData("100.5", true)]
    [InlineData("100.50", true)]
    [InlineData("9999999999999999.99", true)]
    [InlineData("0", false)]
    [InlineData("-0.01", false)]
    [InlineData("-100", false)]
    [InlineData("0.001", false)]
    [InlineData("1.005", false)]
    [InlineData("10000000000000000", false)]
    public void PoprawnaKwota(string kwota, bool oczekiwane) =>
        Assert.Equal(oczekiwane, KwotaValidator.PoprawnaKwota(decimal.Parse(kwota, CultureInfo.InvariantCulture)));
}

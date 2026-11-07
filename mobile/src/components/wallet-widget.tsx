import { View, ScrollView } from "react-native";
import { CustomContainer } from "@/components/ui/custom-container";
import { ThemedText } from "@/components/ui/themed-text";
import { CustomButton } from "@/components/ui/custom-button";
import { WalletCurrencyRow } from "@/components/wallet-currency-row";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { KursyResponse, SaldoResponse } from "@/lib/api-types";
import { router } from "expo-router";
import { useStore } from "@/hooks/use-store";

export function WalletWidget() {
  const mainCurrency = useStore((state) => state.mainCurrency);

  const { data: saldaData } = useQuery({
    queryKey: ["saldo"],
    queryFn: () => apiRequest<SaldoResponse>("/konta/me/saldo"),
  });

  const { data: exchangeRates } = useQuery({
    queryKey: ["kursy"],
    queryFn: () => apiRequest<KursyResponse>("/kursy"),
  });

  const salda = saldaData?.salda ?? [];

  const visibleSalda = salda.filter((s) => s.saldo > 0);

  const sellRateByCurrency = new Map(
    exchangeRates?.map((k) => [k.waluta, k.kursZakupuPrzezKantor]),
  );
  const inMainCurrency = (waluta: string, saldo: number) =>
    saldo *
    (waluta === mainCurrency ? 1 : (sellRateByCurrency.get(waluta) ?? 0));

  const walletValueInMainCurrency = salda.reduce(
    (sum, s) => sum + inMainCurrency(s.waluta, s.saldo),
    0,
  );
  return (
    <View style={{ flex: 12 }}>
      <CustomContainer
        style={{
          flex: 2,
          borderBottomWidth: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <View
          style={{
            padding: 8,
          }}
        >
          <ThemedText type="default">Stan portfela</ThemedText>
          <ThemedText type="title">
            {walletValueInMainCurrency.toFixed(2)} {mainCurrency}
          </ThemedText>
        </View>
        <View
          style={{
            flexDirection: "row",
            paddingBottom: 2,
            paddingHorizontal: 16,
          }}
        >
          <View style={{ width: 24 }}></View>
          <ThemedText
            type="label"
            themeColor="textSecondary"
            style={{ flex: 5, paddingLeft: 24 }}
            numberOfLines={1}
          >
            Wartość
          </ThemedText>
          <ThemedText
            type="label"
            themeColor="textSecondary"
            style={{ flex: 4, textAlign: "left" }}
            numberOfLines={1}
          >
            Wartość w {mainCurrency}
          </ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 4 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          style={{ width: "100%" }}
        >
          {saldaData && visibleSalda.length === 0 && (
            <View style={{ paddingVertical: 24, alignItems: "center" }}>
              <ThemedText type="label" themeColor="textSecondary">
                Brak środków na koncie
              </ThemedText>
            </View>
          )}
          {visibleSalda.map((s) => (
            <WalletCurrencyRow
              key={s.waluta}
              currency={s.waluta}
              amount={s.saldo}
              amountInMainCurrency={inMainCurrency(s.waluta, s.saldo)}
            />
          ))}
        </ScrollView>
      </CustomContainer>
      <View style={{ flexDirection: "row" }}>
        <CustomButton
          onPress={() => {
            router.push("/deposit");
          }}
          label="Wpłata"
          style={{
            borderBottomLeftRadius: 25,
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0,
            borderBottomRightRadius: 0,
            borderRightWidth: 1,
            width: "50%",
          }}
        />
        <CustomButton
          label="Przelewy"
          onPress={() => router.push("/transfers")}
          style={{
            borderTopRightRadius: 0,
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderBottomRightRadius: 25,
            borderLeftWidth: 1,
            width: "50%",
          }}
        />
      </View>
    </View>
  );
}

import { View } from "react-native";
import { CustomContainer } from "@/components/ui/custom-container";
import { ThemedText } from "@/components/ui/themed-text";
import { CustomButton } from "@/components/ui/custom-button";
import { WalletCurrencyRow } from "@/components/wallet-currency-row";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { SaldoResponse } from "@/lib/api-types";

export function WalletWidget() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["saldo"],
    queryFn: () => apiRequest<SaldoResponse>("/konta/me/saldo"),
  });
  const salda = data?.salda ?? [];
  const walletValueInMainCurrency =
    salda.find((s) => s.waluta === "PLN")?.saldo ?? 0;
  return (
    <View style={{ flex: 2 }}>
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
            {walletValueInMainCurrency.toFixed(2)} PLN
          </ThemedText>
        </View>
        <WalletCurrencyRow
          currency="USD"
          amount={100.0}
          amountInMainCurrency={400.0}
        ></WalletCurrencyRow>
      </CustomContainer>
      <View style={{ flexDirection: "row" }}>
        <CustomButton
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
          label="Wypłata"
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

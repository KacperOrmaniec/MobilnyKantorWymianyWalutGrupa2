import BaseView from "@/components/base-view";
import { CustomContainer } from "@/components/ui/custom-container";
import { ThemedText } from "@/components/ui/themed-text";
import { router, useLocalSearchParams } from "expo-router";
import { LineChart } from "react-native-gifted-charts";
import { useState } from "react";
import { View, Image } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInputField } from "@/components/ui/custom-input-field";
import { apiRequest } from "@/lib/api-client";
import { KursyHistoryczneResponse, KursyResponse } from "@/lib/api-types";
import { useTheme } from "@/hooks/use-theme";
import { CURRENCY_FLAGS } from "@/hooks/flags";
import { useStore } from "@/hooks/use-store";

export default function ExchangeDetailsScreen() {
  const [containerWidth, setContainerWidth] = useState(0);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const queryClient = useQueryClient();
  const { currency } = useLocalSearchParams<{ currency: string }>();
  const mainCurrency = useStore((state) => state.mainCurrency);

  const {
    data: exchangeRatesHistory,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["kursyHistoryczne", currency],
    queryFn: () =>
      apiRequest<KursyHistoryczneResponse>(
        "/kursy/historyczne?waluta=" + currency,
      ),
  });
  const { data: exchangeRates } = useQuery({
    queryKey: ["kursy"],
    queryFn: () => apiRequest<KursyResponse>("/kursy"),
  });
  const isBuy = mode === "buy";
  const rateInfo = exchangeRates?.find((k) => k.waluta === currency);
  const rate = rateInfo
    ? isBuy
      ? rateInfo.kursSprzedazyPrzezKantor
      : rateInfo.kursZakupuPrzezKantor
    : undefined;

  const exchangeMutation = useMutation({
    mutationFn: (kwota: number) =>
      apiRequest<{ message: string }>("/konta/me/przewalutowanie", {
        method: "POST",
        body: JSON.stringify({
          waluta: currency,
          kwota,
          typTransakcji: isBuy ? "ZAKUP" : "SPRZEDAZ",
        }),
      }),
    onSuccess: () => {
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["saldo"] });
      queryClient.invalidateQueries({ queryKey: ["transakcje"] });
    },
  });

  const graphExchangeRateValues =
    exchangeRatesHistory?.map((d) => d.kursAvg) || [];
  const min = Math.min(...graphExchangeRateValues);
  const max = Math.max(...graphExchangeRateValues);
  const pad = (max - min) / 10;

  const amountParsed = Number(amount.replace(",", "."));
  const amountInMainCurrency =
    rate && Number.isFinite(amountParsed)
      ? (amountParsed * rate).toFixed(2)
      : "";
  return (
    <BaseView style={{ paddingBottom: 30 }}>
      <CustomContainer
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            width: "100%",
            justifyContent: "center",
          }}
        >
          <Image
            source={CURRENCY_FLAGS[currency]}
            style={{ height: 40, width: 50 }}
            resizeMode="contain"
          />
          <ThemedText type="title">{currency}</ThemedText>
        </View>

        <ThemedText type="label" themeColor="textSecondary">
          Średni kurs historyczny:
        </ThemedText>

        <LineChart
          data={exchangeRatesHistory?.map((d) => ({ value: d.kursAvg })) || []}
          yAxisTextStyle={{ color: useTheme().text }}
          showFractionalValues
          color={useTheme().text}
          yAxisColor={useTheme().text}
          xAxisThickness={0}
          thickness={3}
          hideDataPoints
          xAxisColor="white"
          yAxisOffset={min - pad}
          yAxisLabelWidth={60}
          roundToDigits={4}
          noOfSections={7}
          adjustToWidth={true}
          parentWidth={containerWidth - 40}
          initialSpacing={0}
          height={160}
        />

        <View style={{ flexDirection: "row", gap: 12 }}>
          <CustomButton
            label="Zakup"
            onPress={() => setMode("buy")}
            style={{
              flex: 1,
              backgroundColor: isBuy ? useTheme().elementSelected : undefined,
            }}
          />
          <CustomButton
            label="Sprzedaż"
            onPress={() => setMode("sell")}
            style={{
              flex: 1,
              backgroundColor: isBuy ? undefined : useTheme().elementSelected,
            }}
          />
        </View>

        <View style={{ width: "100%", gap: 8, marginTop: 12 }}>
          <ThemedText type="default">
            {rate
              ? `${isBuy ? "Aktualny kurs zakupu" : "Aktualny kurs sprzedaży"}: ${rate.toFixed(4)} PLN`
              : "Kurs niedostępny"}
          </ThemedText>
          <View
            style={{
              flexDirection: "row",
              gap: 12,
              justifyContent: "center",
            }}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText type="label" themeColor="textSecondary">
                Kwota w {currency}
              </ThemedText>
              <CustomInputField
                value={amount}
                onChangeText={setAmount}
                placeholder="0,00"
                keyboardType="decimal-pad"
              />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText type="label" themeColor="textSecondary">
                Kwota w {mainCurrency}
              </ThemedText>
              <CustomInputField editable={false} value={amountInMainCurrency} />
            </View>
          </View>

          {exchangeMutation.error && (
            <ThemedText type="label" style={{ color: "red" }}>
              {exchangeMutation.error.message}
            </ThemedText>
          )}

          <CustomButton
            label={
              exchangeMutation.isPending
                ? "Przetwarzam..."
                : isBuy
                  ? "Kup"
                  : "Sprzedaj"
            }
            onPress={() =>
              exchangeMutation.mutate(Number(amount.replace(",", ".")))
            }
            disabled={exchangeMutation.isPending}
          />
          <CustomButton label="Wróć" onPress={() => router.back()} />
        </View>
      </CustomContainer>
    </BaseView>
  );
}

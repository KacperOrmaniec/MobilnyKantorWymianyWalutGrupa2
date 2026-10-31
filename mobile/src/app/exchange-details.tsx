import BaseView from "@/components/base-view";
import { CustomContainer } from "@/components/ui/custom-container";
import { ThemedText } from "@/components/ui/themed-text";
import { router, useLocalSearchParams } from "expo-router";
import { LineChart } from "react-native-gifted-charts";
import { useState } from "react";
import { View } from "react-native";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomInputField } from "@/components/ui/custom-input-field";
import { apiRequest } from "@/lib/api-client";
import { KursyHistoryczneResponse, KursyResponse } from "@/lib/api-types";
import { useTheme } from "@/hooks/use-theme";

export default function ExchangeDetailsScreen() {
  const [containerWidth, setContainerWidth] = useState(0);
  const [amount, setAmount] = useState("");
  const queryClient = useQueryClient();
  const { currency } = useLocalSearchParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["kursyHistoryczne", currency],
    queryFn: () =>
      apiRequest<KursyHistoryczneResponse>(
        "/kursy/historyczne?waluta=" + currency,
      ),
  });
  const { data: kursy } = useQuery({
    queryKey: ["kursy"],
    queryFn: () => apiRequest<KursyResponse>("/kursy"),
  });
  const kurs = kursy?.find((k) => k.waluta === currency);

  const buyMutation = useMutation({
    mutationFn: (kwota: number) =>
      apiRequest<{ message: string }>("/konta/me/przewalutowanie", {
        method: "POST",
        body: JSON.stringify({
          waluta: currency,
          kwota,
          typTransakcji: "ZAKUP",
        }),
      }),
    onSuccess: () => {
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["saldo"] });
      queryClient.invalidateQueries({ queryKey: ["transakcje"] });
    },
  });

  const graphExchangeRateValues = data?.map((d) => d.kursAvg) || [];
  const min = Math.min(...graphExchangeRateValues);
  const max = Math.max(...graphExchangeRateValues);
  const pad = (max - min) / 10;

  return (
    <BaseView>
      <CustomContainer
        onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
      >
        <ThemedText type="default">Szczegóły waluty: {currency}</ThemedText>

        <LineChart
          data={data?.map((d) => ({ value: d.kursAvg })) || []}
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
        />

        <View style={{ width: "100%", gap: 12, marginTop: 24 }}>
          <ThemedText type="default" style={{ color: "#36A836" }}>
            {kurs
              ? `Aktualny kurs zakupu: ${kurs.kursSprzedazyPrzezKantor.toFixed(4)} PLN`
              : "Kurs niedostępny"}
          </ThemedText>
          <ThemedText type="label" themeColor="textSecondary">
            Kwota w {currency}
          </ThemedText>
          <CustomInputField
            value={amount}
            onChangeText={setAmount}
            placeholder="0,00"
            keyboardType="decimal-pad"
          />
          {buyMutation.error && (
            <ThemedText type="label" style={{ color: "red" }}>
              {buyMutation.error.message}
            </ThemedText>
          )}

          <CustomButton
            label={buyMutation.isPending ? "Kupuję..." : "Kup"}
            onPress={() => buyMutation.mutate(Number(amount.replace(",", ".")))}
            disabled={buyMutation.isPending}
          />
          <CustomButton label="Wróć" onPress={() => router.back()} />
        </View>
      </CustomContainer>
    </BaseView>
  );
}

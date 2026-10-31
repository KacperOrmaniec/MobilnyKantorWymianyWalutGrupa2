import { ScrollView, View } from "react-native";
import { router } from "expo-router";
import { ThemedText } from "@/components/ui/themed-text";
import BaseView from "@/components/base-view";
import { CustomContainer } from "@/components/ui/custom-container";
import { ExchangeCurrencyRow } from "@/components/exchange-currency-row";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { KursyResponse } from "@/lib/api-types";

export default function ExchangeScreen() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["kursy"],
    queryFn: () => apiRequest<KursyResponse>("/kursy"),
  });
  const kursy = data ?? [];
  return (
    <BaseView>
      <CustomContainer>
        <View
          style={{
            padding: 8,
            marginBottom: 28,
          }}
        >
          <ThemedText type="default">Kursy walut</ThemedText>
        </View>
        <View
          style={{
            flexDirection: "row",
            paddingBottom: 2,
            paddingHorizontal: 16,
          }}
        >
          <View
            style={{
              flex: 5,
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          ></View>

          <ThemedText
            type="label"
            themeColor="textSecondary"
            style={{ flex: 6, paddingLeft: 24 }}
          >
            Sprzedaż
          </ThemedText>
          <ThemedText
            type="label"
            themeColor="textSecondary"
            style={{ flex: 5 }}
          >
            Kupno
          </ThemedText>
        </View>

        <ScrollView
          contentContainerStyle={{ paddingBottom: 4 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          style={{ width: "100%" }}
        >
          {kursy.map((s) => (
            <ExchangeCurrencyRow
              key={s.waluta}
              currency={s.waluta}
              sellExchangeRate={s.kursZakupuPrzezKantor}
              buyExchangeRate={s.kursSprzedazyPrzezKantor}
              onPress={() =>
                router.push({
                  pathname: "/exchange-details",
                  params: { waluta: s.waluta },
                })
              }
            />
          ))}
        </ScrollView>
      </CustomContainer>
    </BaseView>
  );
}

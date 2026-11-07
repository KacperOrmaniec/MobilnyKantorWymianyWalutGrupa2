import { FlatList, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import BaseView from "@/components/base-view";
import { CustomContainer } from "@/components/ui/custom-container";
import { CustomButton } from "@/components/ui/custom-button";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { apiRequest } from "@/lib/api-client";
import { Przelew } from "@/lib/api-types";

export default function TransferHistoryScreen() {
  const theme = useTheme();
  const { data, isLoading, error, refetch, isRefetching } = useQuery({
    queryKey: ["przelewy"],
    queryFn: () => apiRequest<Przelew[]>("/konta/me/historia-przelewow"),
  });

  return (
    <BaseView style={{ paddingBottom: 30 }}>
      <CustomContainer style={{ gap: 16 }}>
        <ThemedText type="title">Historia przelewów</ThemedText>
        {error && (
          <>
            <ThemedText type="label" style={{ color: "red" }}>
              {error.message}
            </ThemedText>
            <CustomButton
              label="Spróbuj ponownie"
              onPress={() => refetch()}
              style={{ width: "100%" }}
            />
          </>
        )}
        <FlatList
          data={data ?? []}
          keyExtractor={(item) => String(item.id)}
          style={{ width: "100%" }}
          refreshing={isRefetching}
          onRefresh={() => refetch()}
          ListEmptyComponent={
            <ThemedText type="label" themeColor="textSecondary">
              {isLoading
                ? "Ładowanie..."
                : error
                  ? "Nie udało się pobrać historii."
                  : "Brak przelewów"}
            </ThemedText>
          }
          renderItem={({ item }) => (
            <View
              style={{
                gap: 4,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: theme.stroke,
              }}
            >
              <ThemedText>
                {item.kwota.toFixed(2)} {item.waluta}
              </ThemedText>
              <ThemedText type="label">Nadawca: {item.nazwaNadawcy}</ThemedText>
              <ThemedText type="label">
                Odbiorca: {item.nazwaOdbiorcy}
              </ThemedText>
              <ThemedText type="label" themeColor="textSecondary">
                {new Date(item.timestamp).toLocaleString("pl-PL", {
                  timeZone: "Europe/Warsaw",
                })}
              </ThemedText>
            </View>
          )}
        />
        <CustomButton label="Wróć" onPress={() => router.back()} />
      </CustomContainer>
    </BaseView>
  );
}

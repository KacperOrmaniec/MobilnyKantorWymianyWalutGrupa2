import { FlatList, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import BaseView from "@/components/base-view";
import { CustomContainer } from "@/components/ui/custom-container";
import { ThemedText } from "@/components/ui/themed-text";
import { CustomButton } from "@/components/ui/custom-button";
import { TransactionRow } from "@/components/transaction-row";
import { apiRequest } from "@/lib/api-client";
import { TransakcjeResponse } from "@/lib/api-types";

export default function TransactionHistoryScreen() {
  const { data, isLoading } = useQuery({
    queryKey: ["transakcje"],
    queryFn: () => apiRequest<TransakcjeResponse>("/konta/me/transakcje"),
  });

  const transactions = data ?? [];

  return (
    <BaseView style={{ paddingBottom: 30 }}>
      <CustomContainer>
        <View style={{ padding: 8, marginBottom: 12 }}>
          <ThemedText type="default">Historia transakcji</ThemedText>
        </View>
        <FlatList
          data={transactions}
          keyExtractor={(t) => `${t.rodzaj}-${t.id}`}
          showsVerticalScrollIndicator={false}
          style={{ width: "100%" }}
          contentContainerStyle={{ paddingBottom: 4 }}
          ListEmptyComponent={
            <ThemedText type="label" themeColor="textSecondary">
              {isLoading ? "Ładowanie..." : "Brak transakcji"}
            </ThemedText>
          }
          renderItem={({ item }) => <TransactionRow transaction={item} />}
        />
        <CustomButton
          label="Wróć"
          onPress={() => router.back()}
          style={{ marginVertical: 20 }}
        />
      </CustomContainer>
    </BaseView>
  );
}

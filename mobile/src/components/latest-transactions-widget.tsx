import { View } from "react-native";
import { CustomContainer } from "@/components/ui/custom-container";
import { ThemedText } from "@/components/ui/themed-text";
import { CustomButton } from "@/components/ui/custom-button";
import { TransactionRow } from "@/components/transaction-row";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api-client";
import { TransakcjeResponse } from "@/lib/api-types";

export function LatestTransactionWidget() {
  const { data } = useQuery({
    queryKey: ["transakcje"],
    queryFn: () => apiRequest<TransakcjeResponse>("/konta/me/transakcje"),
  });

  const latestTransaction = data?.[0];

  return (
    <View style={{ flex: 5 }}>
      <CustomContainer
        style={{
          flex: 2,
          justifyContent: "space-between",
          borderBottomWidth: 0,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        }}
      >
        <View
          style={{
            padding: 2,
          }}
        >
          <ThemedText type="default">Ostatnia transakcja</ThemedText>
        </View>
        <View
          style={{
            flex: 1,
            width: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          {latestTransaction ? (
            <TransactionRow transaction={latestTransaction} />
          ) : (
            <ThemedText type="label" themeColor="textSecondary">
              Brak transakcji
            </ThemedText>
          )}
        </View>
      </CustomContainer>
      <CustomButton
        onPress={() => router.push("/transaction-history")}
        label="Zobacz więcej"
        style={{
          borderTopRightRadius: 0,
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 25,
          borderBottomRightRadius: 25,
          width: "100%",
        }}
      />
    </View>
  );
}

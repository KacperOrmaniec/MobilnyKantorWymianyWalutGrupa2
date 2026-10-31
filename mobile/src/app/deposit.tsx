import { useState } from "react";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import BaseView from "@/components/base-view";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomContainer } from "@/components/ui/custom-container";
import { CustomInputField } from "@/components/ui/custom-input-field";
import { ThemedText } from "@/components/ui/themed-text";
import { apiRequest } from "@/lib/api-client";

export default function DepositScreen() {
  const [amount, setAmount] = useState("");
  const queryClient = useQueryClient();

  const depositMutation = useMutation({
    mutationFn: (amount: number) =>
      apiRequest<{ message: string }>("/konta/me/doladowanie", {
        method: "POST",
        body: JSON.stringify({ kwota: amount }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saldo"] });
      queryClient.invalidateQueries({ queryKey: ["transakcje"] });
      router.back();
    },
  });
  const errorMessage = depositMutation.error?.message;

  const parsedAmount = Number(amount.replace(",", "."));

  return (
    <BaseView>
      <CustomContainer style={{ flex: 0, gap: 16, alignItems: "stretch" }}>
        <ThemedText type="title">Doładowanie</ThemedText>
        <ThemedText type="label" themeColor="textSecondary">
          Kwota w PLN
        </ThemedText>
        <CustomInputField
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          keyboardType="decimal-pad"
          autoFocus
        />
        {errorMessage && (
          <ThemedText type="label" style={{ color: "red" }}>
            {errorMessage}
          </ThemedText>
        )}
        <CustomButton
          label={depositMutation.isPending ? "Ładowanie..." : "Doładuj"}
          onPress={() => depositMutation.mutate(parsedAmount)}
          disabled={depositMutation.isPending}
        />
        <CustomButton label="Anuluj" onPress={() => router.back()} />
      </CustomContainer>
    </BaseView>
  );
}

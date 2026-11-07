import { useState } from "react";
import { ScrollView } from "react-native";
import { router } from "expo-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import BaseView from "@/components/base-view";
import { CustomButton } from "@/components/ui/custom-button";
import { CustomContainer } from "@/components/ui/custom-container";
import { CustomInputField } from "@/components/ui/custom-input-field";
import { ThemedText } from "@/components/ui/themed-text";
import { apiRequest } from "@/lib/api-client";

export default function TransfersScreen() {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("PLN");
  const queryClient = useQueryClient();
  const transferMutation = useMutation({
    mutationFn: () =>
      apiRequest<{ message: string }>("/przelewy", {
        method: "POST",
        body: JSON.stringify({
          loginOdbiorcy: recipient.trim(),
          kwota: Number(amount.replace(",", ".")),
          waluta: currency.trim().toUpperCase(),
        }),
      }),
    onSuccess: () => {
      setAmount("");
      queryClient.invalidateQueries({ queryKey: ["saldo"] });
      queryClient.invalidateQueries({ queryKey: ["profil"] });
      queryClient.invalidateQueries({ queryKey: ["transakcje"] });
      queryClient.invalidateQueries({ queryKey: ["przelewy"] });
    },
  });
  const validAmount =
    /^\d+([.,]\d{1,2})?$/.test(amount.trim()) &&
    Number.isFinite(Number(amount.replace(",", "."))) &&
    Number(amount.replace(",", ".")) > 0;

  return (
    <BaseView style={{ paddingBottom: 30 }}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <CustomContainer style={{ flex: 0, gap: 16, alignItems: "stretch" }}>
          <ThemedText type="title">Przelewy</ThemedText>
          <ThemedText type="label" themeColor="textSecondary">
            Login odbiorcy
          </ThemedText>
          <CustomInputField
            value={recipient}
            onChangeText={(value) => {
              setRecipient(value);
              transferMutation.reset();
            }}
            placeholder="Login odbiorcy"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!transferMutation.isPending}
          />
          <ThemedText type="label" themeColor="textSecondary">
            Kwota
          </ThemedText>
          <CustomInputField
            value={amount}
            onChangeText={(value) => {
              setAmount(value);
              transferMutation.reset();
            }}
            placeholder="0,00"
            keyboardType="decimal-pad"
            editable={!transferMutation.isPending}
          />
          {amount.length > 0 && !validAmount && (
            <ThemedText type="label" style={{ color: "red" }}>
              Podaj dodatnią kwotę z najwyżej 2 miejscami po przecinku.
            </ThemedText>
          )}
          <ThemedText type="label" themeColor="textSecondary">
            Waluta
          </ThemedText>
          <CustomInputField
            value={currency}
            onChangeText={(value) => {
              setCurrency(value);
              transferMutation.reset();
            }}
            placeholder="np. PLN, EUR, USD"
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!transferMutation.isPending}
          />
          {transferMutation.error && (
            <ThemedText type="label" style={{ color: "red" }}>
              {transferMutation.error.message}
            </ThemedText>
          )}
          {transferMutation.isSuccess && (
            <ThemedText type="label">
              {transferMutation.data.message}
            </ThemedText>
          )}
          <CustomButton
            label={
              transferMutation.isPending ? "Wysyłanie..." : "Wyślij przelew"
            }
            onPress={() => transferMutation.mutate()}
            disabled={
              transferMutation.isPending ||
              !recipient.trim() ||
              !validAmount ||
              !currency.trim()
            }
            style={{ width: "100%" }}
          />
          <CustomButton
            label="Historia przelewów"
            onPress={() => router.push("/transfer-history")}
            style={{ width: "100%" }}
          />
          <CustomButton label="Wróć" onPress={() => router.back()} />
        </CustomContainer>
      </ScrollView>
    </BaseView>
  );
}

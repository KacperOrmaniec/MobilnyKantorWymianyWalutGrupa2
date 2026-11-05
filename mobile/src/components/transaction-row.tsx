import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  Image,
} from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { CURRENCY_FLAGS } from "@/hooks/flags";
import { TRANSACTION_LABELS } from "@/lib/transaction-labels";
import { TRANSACTION_SIGNS } from "@/lib/transaction-signs";
import type { Transakcja } from "@/lib/api-types";

export type TransactionRowProps = PressableProps & {
  transaction: Transakcja;
  style?: StyleProp<ViewStyle>;
};

export function TransactionRow({
  transaction,
  style,
  onPress,
  ...otherProps
}: TransactionRowProps) {
  const theme = useTheme();

  // Przy zakupie waluty, kwota i waluta do wyświetlenia to kwotaDocelowa i walutaDocelowa.

  const buy = transaction.rodzaj === "ZAKUP";
  const currency = buy
    ? transaction.walutaDocelowa
    : transaction.walutaZrodlowa;
  const amount = buy
    ? (transaction.kwotaDocelowa ?? transaction.kwota)
    : transaction.kwota;

  return (
    <Pressable
      onPress={onPress}
      style={[
        {
          marginBottom: 10,
          backgroundColor: theme.elementDefault,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          height: 54,
          width: "100%",
          borderRadius: 16,
        },
        style,
      ]}
      {...otherProps}
    >
      <Image
        source={CURRENCY_FLAGS[currency]}
        style={{ height: 18, width: 26 }}
        resizeMode="contain"
      />
      <ThemedText
        style={{ flex: 5, paddingLeft: 24, color: theme.text }}
        numberOfLines={1}
      >
        {TRANSACTION_SIGNS[transaction.rodzaj]} {amount.toFixed(2)} {currency}
      </ThemedText>
      <ThemedText
        type="label"
        themeColor="textSecondary"
        style={{ flex: 4, textAlign: "right" }}
        numberOfLines={1}
      >
        {TRANSACTION_LABELS[transaction.rodzaj]}
      </ThemedText>
    </Pressable>
  );
}

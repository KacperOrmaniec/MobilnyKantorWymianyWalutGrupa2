import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/hooks/use-theme";

type WalletCurrencyRowProps = PressableProps & {
  currency: string;
  amount: number;
  amountInMainCurrency: number;
  style?: StyleProp<ViewStyle>;
};

export function WalletCurrencyRow({
  currency = "USD",
  amount = 100.0,
  amountInMainCurrency = 400.0,
  style,
  onPress,
  ...otherProps
}: WalletCurrencyRowProps) {
  const theme = useTheme();
  return (
    <Pressable
      style={[
        {
          marginTop: 10,
          backgroundColor: theme.elementDefault,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          height: 54,
          width: "100%",
          borderRadius: 16,
          gap: 70,
        },
        style,
      ]}
      {...otherProps}
    >
      <ThemedText>{currency}</ThemedText>
      <ThemedText>{amount}</ThemedText>
      <ThemedText>{amountInMainCurrency}</ThemedText>
    </Pressable>
  );
}

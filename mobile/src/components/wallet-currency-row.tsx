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

type WalletCurrencyRowProps = PressableProps & {
  currency: string;
  amount: number;
  amountInMainCurrency: number;
  style?: StyleProp<ViewStyle>;
};

export function WalletCurrencyRow({
  currency,
  amount,
  amountInMainCurrency,
  style,
  onPress,
  ...otherProps
}: WalletCurrencyRowProps) {
  const theme = useTheme();
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
      <ThemedText style={{ flex: 5, paddingLeft: 24 }} numberOfLines={1}>
        {amount.toFixed(2)} {currency}
      </ThemedText>
      <ThemedText style={{ flex: 4, textAlign: "left" }} numberOfLines={1}>
        {amountInMainCurrency.toFixed(2)}
      </ThemedText>
    </Pressable>
  );
}

import {
  Pressable,
  PressableProps,
  StyleProp,
  ViewStyle,
  Image,
  View,
} from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
import { useTheme } from "@/hooks/use-theme";
import { CURRENCY_FLAGS } from "@/hooks/flags";

type ExchangeCurrencyRowProps = PressableProps & {
  currency: string;
  sellExchangeRate: number;
  buyExchangeRate: number;

  style?: StyleProp<ViewStyle>;
};

export function ExchangeCurrencyRow({
  currency,
  sellExchangeRate,
  buyExchangeRate,
  style,
  onPress,
  ...otherProps
}: ExchangeCurrencyRowProps) {
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
      <View
        style={{ flex: 5, flexDirection: "row", alignItems: "center", gap: 8 }}
      >
        <Image
          source={CURRENCY_FLAGS[currency]}
          style={{ height: 18, width: 26 }}
          resizeMode="contain"
        />
        <ThemedText numberOfLines={1}>{currency}</ThemedText>
      </View>

      <ThemedText
        style={{ flex: 6, color: "#ff0000", paddingLeft: 24 }}
        numberOfLines={1}
      >
        {sellExchangeRate.toFixed(4)}
      </ThemedText>
      <ThemedText style={{ flex: 5, color: "#36A836" }} numberOfLines={1}>
        {buyExchangeRate.toFixed(4)}
      </ThemedText>
    </Pressable>
  );
}

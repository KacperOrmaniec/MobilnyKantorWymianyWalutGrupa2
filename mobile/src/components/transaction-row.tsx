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

export type TransactionRowProps = PressableProps & {
  currency: string;
  amount: number;
  typeOfTransaction:
    | "deposit"
    | "exchangeBuy"
    | "exchangeSell"
    | "transferOut"
    | "transferIn";
  style?: StyleProp<ViewStyle>;
};

export function TransactionRow({
  currency,
  amount,
  typeOfTransaction,
  style,
  onPress,
  ...otherProps
}: TransactionRowProps) {
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
      <ThemedText
        style={{ flex: 5, paddingLeft: 24, color: theme.text }}
        numberOfLines={1}
      >
        {amount.toFixed(2)} {currency}
      </ThemedText>
    </Pressable>
  );
}

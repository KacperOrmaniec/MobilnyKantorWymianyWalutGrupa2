import { StyleSheet, Text, type TextProps } from "react-native";

import { ThemeColor } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

export type ThemedTextProps = TextProps & {
  type?: "title" | "default" | "label";
  themeColor?: ThemeColor;
};

export function ThemedText({
  style,
  type = "default",
  themeColor,
  ...rest
}: ThemedTextProps) {
  const theme = useTheme();

  return (
    <Text
      style={[{ color: theme[themeColor ?? "text"] }, styles[type], style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 48,
    lineHeight: 52,
    fontWeight: 600,
  },
  default: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: 500,
  },
  label: {
    fontSize: 12,
    lineHeight: 20,
    fontWeight: 500,
  },
});

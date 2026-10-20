import { StyleSheet, View, type ViewProps } from "react-native";

import { useTheme } from "@/hooks/use-theme";

export function CustomContainer({ style, children, ...otherProps }: ViewProps) {
  const theme = useTheme();

  return (
    <View
      style={[{ borderColor: theme.stroke }, styles.base, style]}
      {...otherProps}
    >
      {children}
    </View>
  );
}
const styles = StyleSheet.create({
  base: {
    padding: 12,
    flex: 1,
    flexDirection: "column",
    alignItems: "flex-start",
    borderWidth: 2,
    borderRadius: 25,
  },
});

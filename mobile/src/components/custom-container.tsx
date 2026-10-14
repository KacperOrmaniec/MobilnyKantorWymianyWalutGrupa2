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
    flex: 1,
    padding: 10,
    borderWidth: 2,
    borderRadius: 25,
    width: "100%",
  },
});

import { Pressable } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useTheme } from "@/hooks/use-theme";

export function CustomButton({
  label = "Click me",
  style,
  onPress,
  ...otherProps
}: any) {
  const theme = useTheme();
  return (
    <Pressable
      style={[
        {
          backgroundColor: theme.elementDefault,
          alignItems: "center",
          paddingVertical: 10,
          width: 150,
          borderRadius: 25,
          borderColor: theme.stroke,
          borderWidth: 2,
        },
        style,
      ]}
      {...otherProps}
    >
      <ThemedText>{label}</ThemedText>
    </Pressable>
  );
}

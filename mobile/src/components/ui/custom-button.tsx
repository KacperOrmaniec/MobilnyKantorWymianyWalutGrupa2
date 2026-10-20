import { Pressable } from "react-native";
import { ThemedText } from "@/components/ui/themed-text";
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
      onPress={onPress}
      style={[
        {
          alignSelf: "center",
          backgroundColor: theme.elementDefault,
          alignItems: "center",
          justifyContent: "center",
          height: 53,
          width: 150,
          borderRadius: 14,
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

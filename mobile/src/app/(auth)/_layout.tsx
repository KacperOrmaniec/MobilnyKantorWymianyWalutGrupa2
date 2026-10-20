import { Stack } from "expo-router";
import { View } from "react-native";
import { useTheme } from "@/hooks/use-theme";

export default function AuthLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        contentStyle: { paddingHorizontal: 10 },

        headerShown: false,
        animation: "none",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

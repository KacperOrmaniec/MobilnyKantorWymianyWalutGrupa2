import { Stack } from "expo-router";
import { useTheme } from "@/hooks/use-theme";

export default function AuthLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        contentStyle: {
          paddingHorizontal: 10,
          backgroundColor: theme.background,
        },

        headerShown: false,
        animation: "none",
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}

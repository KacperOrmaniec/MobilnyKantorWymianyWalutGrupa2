import { QueryClientProvider } from "@tanstack/react-query";
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from "expo-router";
import { useColorScheme, View } from "react-native";
import { useTheme } from "@/hooks/use-theme";
import { queryClient } from "@/lib/query-client";
import { Image } from "expo-image";
import { useStore } from "@/hooks/use-store";
import { apiRequest } from "@/lib/api-client";
import { useEffect } from "react";
import * as SystemUI from "expo-system-ui";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const theme = useTheme();
  const isLoggedIn = useStore((state) => !!state.token);

  useEffect(() => {
    // Test API request on component mount
    apiRequest("/test")
      .then((data) => console.log("[api] /test:", data))
      .catch((e) => console.log("[api] /test failed:", e.message));
  }, []);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.background);
  }, [theme.background]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            header: () => (
              <View
                style={{
                  backgroundColor: theme.background,
                  height: 130,
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <Image
                  source={require("@/assets/logo.svg")}
                  contentFit="contain"
                  style={{ width: 140, height: 50 }}
                  tintColor={theme.text}
                />
              </View>
            ),
            headerShown: true,
            animation: "none",
          }}
        >
          <Stack.Protected guard={isLoggedIn}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="deposit" />
            <Stack.Screen name="transaction-history" />
            <Stack.Screen name="exchange-details" />
          </Stack.Protected>
          <Stack.Protected guard={!isLoggedIn}>
            <Stack.Screen name="(auth)" />
          </Stack.Protected>
        </Stack>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

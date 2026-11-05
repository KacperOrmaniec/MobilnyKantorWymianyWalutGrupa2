import { ThemedText } from "@/components/ui/themed-text";
import { Pressable, View } from "react-native";
import { useQuery } from "@tanstack/react-query";

import BaseView from "@/components/base-view";
import { CustomContainer } from "@/components/ui/custom-container";
import { CustomButton } from "@/components/ui/custom-button";
import { apiRequest } from "@/lib/api-client";
import { ProfilResponse } from "@/lib/api-types";
import { useStore } from "@/hooks/use-store";
import { useTheme } from "@/hooks/use-theme";

const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Jasny" },
  { value: "dark", label: "Ciemny" },
] as const;

export default function ProfileScreen() {
  const logout = useStore((state) => state.logout);
  const mainCurrency = useStore((state) => state.mainCurrency);
  const themeMode = useStore((state) => state.themeMode);
  const setThemeMode = useStore((state) => state.setThemeMode);
  const theme = useTheme();

  const { data: profile } = useQuery({
    queryKey: ["profil"],
    queryFn: () => apiRequest<ProfilResponse>("/konta/me"),
  });

  const settings = [{ label: "Waluta główna", value: mainCurrency }];

  return (
    <BaseView style={{ gap: 18 }}>
      <CustomContainer style={{ flex: 0, gap: 4, alignItems: "stretch" }}>
        <ThemedText type="title">
          {profile ? `${profile.imie} ${profile.nazwisko}` : "—"}
        </ThemedText>
        <ThemedText type="label" themeColor="textSecondary">
          @{profile?.login ?? "—"}
        </ThemedText>
      </CustomContainer>

      <CustomContainer style={{ flex: 0, alignItems: "stretch" }}>
        <View style={{ paddingVertical: 12, gap: 8 }}>
          <ThemedText>Motyw</ThemedText>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {THEME_OPTIONS.map((option) => (
              <CustomButton
                key={option.value}
                label={option.label}
                onPress={() => setThemeMode(option.value)}
                variant={option.value === themeMode ? "primary" : "secondary"}
                style={{ flex: 1, height: 42 }}
              />
            ))}
          </View>
        </View>

        {settings.map((setting) => (
          <View
            key={setting.label}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingVertical: 12,
              borderTopWidth: 1,
              borderTopColor: theme.stroke,
            }}
          >
            <ThemedText>{setting.label}</ThemedText>
            <ThemedText type="label" themeColor="textSecondary">
              {setting.value} ›
            </ThemedText>
          </View>
        ))}
      </CustomContainer>

      <CustomButton label="Wyloguj" onPress={logout} />
    </BaseView>
  );
}

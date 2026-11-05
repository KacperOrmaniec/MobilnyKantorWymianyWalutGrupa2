import { Colors } from "@/constants/theme";
import { useColorScheme } from "react-native";
import { useStore } from "./use-store";

export function useTheme() {
  const systemScheme = useColorScheme();
  const themeMode = useStore((s) => s.themeMode);
  const scheme = themeMode === "system" ? systemScheme : themeMode;
  return Colors[scheme === "unspecified" ? "light" : scheme];
}

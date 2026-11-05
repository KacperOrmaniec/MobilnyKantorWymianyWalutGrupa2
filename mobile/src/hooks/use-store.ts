import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { queryClient } from "@/lib/query-client";

interface AppState {
  token: string | null;
  expiresAt: number | null;
  mainCurrency: string;
  themeMode: "system" | "light" | "dark";
  setToken: (token: string | null, expiresAt?: string | null) => Promise<void>;
  setMainCurrency: (currency: string) => void;
  setThemeMode: (mode: "system" | "light" | "dark") => void;
  logout: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  token: null,
  expiresAt: null,
  mainCurrency: "PLN",
  themeMode: "system",

  setToken: async (token, expiresAt) => {
    const exp = expiresAt ? new Date(expiresAt).getTime() : null;

    if (token) {
      await SecureStore.setItemAsync("token", token);
      if (exp) {
        await SecureStore.setItemAsync("expiresAt", String(exp));
      } else {
        await SecureStore.deleteItemAsync("expiresAt");
      }
    } else {
      await SecureStore.deleteItemAsync("token");
      await SecureStore.deleteItemAsync("expiresAt");
    }

    set({ token, expiresAt: exp });
  },
  setThemeMode: (mode) => set({ themeMode: mode }),
  getThemeMode: () => useStore.getState().themeMode,

  setMainCurrency: (currency) => set({ mainCurrency: currency }),
  getMainCurrency: () => useStore.getState().mainCurrency,

  logout: async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("expiresAt");
    set({ token: null, expiresAt: null });
    queryClient.clear();
  },
}));

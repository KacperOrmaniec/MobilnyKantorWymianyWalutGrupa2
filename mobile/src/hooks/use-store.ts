import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

interface AppState {
  token: string | null;
  expiresAt: number | null;
  mainCurrency: string;
  setToken: (token: string | null, expiresAt?: string | null) => Promise<void>;
  setMainCurrency: (currency: string) => void;
  logout: () => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  token: null,
  expiresAt: null,
  mainCurrency: "PLN",

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

  setMainCurrency: (currency) => set({ mainCurrency: currency }),

  logout: async () => {
    await SecureStore.deleteItemAsync("token");
    await SecureStore.deleteItemAsync("expiresAt");
    set({ token: null, expiresAt: null });
  },
}));

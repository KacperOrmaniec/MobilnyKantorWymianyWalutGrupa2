import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEFAULT_HOST = Platform.OS === "android" ? "10.0.2.2" : "localhost";

const API_BASE =
  process.env.EXPO_PUBLIC_API_URL || `http://${DEFAULT_HOST}:5171`;

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  if (__DEV__) console.log("[api] ->", options.method ?? "GET", endpoint);

  const token = await SecureStore.getItemAsync("token");

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    if (__DEV__) console.log("[api] !", response.status, endpoint, errorBody);
    throw new Error(errorBody.message || `Request failed (${response.status})`);
  }

  if (__DEV__) console.log("[api] ok", endpoint);

  if (response.status === 204) return {} as T;
  return response.json();
}

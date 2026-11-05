import type { RodzajTransakcji } from "@/lib/api-types";

export const TRANSACTION_LABELS: Record<RodzajTransakcji, string> = {
  DOLADOWANIE: "Wpłata",
  ZAKUP: "Kupno waluty",
  SPRZEDAZ: "Sprzedaż waluty",
  PRZELEW_WYCHODZACY: "Przelew wychodzący",
  PRZELEW_PRZYCHODZACY: "Przelew przychodzący",
};

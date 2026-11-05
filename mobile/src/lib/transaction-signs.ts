import type { RodzajTransakcji } from "@/lib/api-types";

export const TRANSACTION_SIGNS: Record<RodzajTransakcji, string> = {
  DOLADOWANIE: "+",
  ZAKUP: "+",
  SPRZEDAZ: "-",
  PRZELEW_PRZYCHODZACY: "+",
  PRZELEW_WYCHODZACY: "-",
};

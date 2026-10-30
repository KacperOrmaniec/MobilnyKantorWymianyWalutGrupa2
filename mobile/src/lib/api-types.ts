export type Saldo = { waluta: string; nazwa: string; saldo: number };
export type SaldoResponse = { id: number; salda: Saldo[] };

export type Kurs = {
  id: number;
  timestamp: string;
  waluta: string;
  kursZakupuPrzezKantor: number;
  kursSprzedazyPrzezKantor: number;
};

export type KursyResponse = Kurs[];

export type LoginRequest = { login: string; haslo: string };
export type LoginResponse = { token: string; wygasa: string };
export type RegisterRequest = {
  login: string;
  haslo: string;
  imie: string;
  nazwisko: string;
};
export type RegisterResponse = {
  id: number;
  login: string;
  imie: string;
  nazwisko: string;
};

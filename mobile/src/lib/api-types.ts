export type Saldo = { waluta: string; nazwa: string; saldo: number };
export type SaldoResponse = { id: number; salda: Saldo[] };
export type Kurs = { waluta: string; kursZakupuPrzezKantor: number };
export type LoginRequest = { login: string; haslo: string };
export type LoginResponse = { token: string; wygasa: string };

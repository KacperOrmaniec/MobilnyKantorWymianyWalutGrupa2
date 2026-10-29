export const Colors = {
  light: {
    text: "#000000",
    background: "#EFEEED",
    elementDefault: "#DBDBDB",
    elementSelected: "#E0E1E6",
    textSecondary: "#7a7a7a",
    stroke: "#C9C9C9",
    textInputStroke: "#acacac",
  },
  dark: {
    text: "#ffffff",
    background: "#0A0A0A",
    elementDefault: "#1A1A1A",
    elementSelected: "rgb(42, 45, 49)",
    textSecondary: "#7a7a7a",
    stroke: "#303030",
    textInputStroke: "#4A4A4A",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  sans: "normal",
  serif: "serif",
  rounded: "normal",
  mono: "monospace",
} as const;

export const BottomTabInset = 100;

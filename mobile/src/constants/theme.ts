export const Colors = {
  light: {
    text: "#000000",
    background: "#ffffff",
    backgroundElement: "#F0F0F3",
    backgroundSelected: "#E0E1E6",
    textSecondary: "#60646C",
    stroke: "#C9C9C9",
  },
  dark: {
    text: "#ffffff",
    background: "#0A0A0A",
    backgroundElement: "#1A1A1A",
    backgroundSelected: "#2E3135",
    textSecondary: "#8F8F8F",

    stroke: "#303030",
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = {
  sans: "normal",
  serif: "serif",
  rounded: "normal",
  mono: "monospace",
} as const;

export const BottomTabInset = 84;

import { Platform } from "react-native";

export interface ThemeColors {
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  canvas: string;
  bone: string;
  card: string;
  ink: string;
  body: string;
  mute: string;
  stone: string;
  divider: string;
  hairline: string;
  success: string;
  danger: string;
  warning: string;
  link: string;
  disabledSurface: string;
  disabledText: string;
}

export const lightColors: ThemeColors = {
  primary: "#171717",
  primaryPressed: "#000000",
  onPrimary: "#ffffff",
  canvas: "#ffffff",
  bone: "#fafafa",
  card: "#ffffff",
  ink: "#171717",
  body: "#4d4d4d",
  mute: "#666666",
  stone: "#808080",
  divider: "#ebebeb",
  hairline: "rgba(0,0,0,0.08)",
  success: "#2b9a66",
  danger: "#ff5b4f",
  warning: "#d97706",
  link: "#0072f5",
  disabledSurface: "#fafafa",
  disabledText: "#808080",
};

/**
 * Dark mode inverts the interactive accent: Vercel's dark UI uses a light
 * surface for primary CTAs on the near-black canvas. The design doc's
 * `colors-dark.primary` (#171717) would be invisible on `#0a0a0a`.
 */
export const darkColors: ThemeColors = {
  primary: "#ededed",
  primaryPressed: "#ffffff",
  onPrimary: "#0a0a0a",
  canvas: "#0a0a0a",
  bone: "#111111",
  card: "#0a0a0a",
  ink: "#ededed",
  body: "#a0a0a0",
  mute: "#808080",
  stone: "#666666",
  divider: "#2a2a2a",
  hairline: "rgba(255,255,255,0.1)",
  success: "#2b9a66",
  danger: "#ff5b4f",
  warning: "#d97706",
  link: "#0072f5",
  disabledSurface: "#111111",
  disabledText: "#666666",
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radius = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

const monoFamily = Platform.select({
  ios: "Menlo",
  android: "monospace",
  default: "monospace",
});

export const typography = {
  headingMd: {
    fontSize: 32,
    fontWeight: "600",
    letterSpacing: -1.28,
    lineHeight: 40,
  },
  headingSm: {
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.96,
    lineHeight: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  subtitle: { fontSize: 16, fontWeight: "500", lineHeight: 24 },
  body: { fontSize: 16, fontWeight: "400", lineHeight: 24 },
  button: { fontSize: 14, fontWeight: "500", lineHeight: 20 },
  caption: { fontSize: 12, fontWeight: "500", lineHeight: 16 },
  mono: {
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
    fontFamily: monoFamily,
  },
} as const;

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  typography: typeof typography;
}

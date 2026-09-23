import { Platform } from "react-native";

export interface ThemeColors {
  primary: string;
  primaryPressed: string;
  onPrimary: string;
  brand: string;
  onBrand: string;
  canvas: string;
  surface: string;
  bone: string;
  card: string;
  mutedSurface: string;
  ink: string;
  body: string;
  mute: string;
  stone: string;
  divider: string;
  hairline: string;
  focus: string;
  info: string;
  infoSurface: string;
  success: string;
  successSurface: string;
  danger: string;
  warning: string;
  warningSurface: string;
  warningText: string;
  link: string;
  disabledSurface: string;
  disabledText: string;
}

export const lightColors: ThemeColors = {
  primary: "#171717",
  primaryPressed: "#000000",
  onPrimary: "#ffffff",
  brand: "#0072f5",
  onBrand: "#ffffff",
  canvas: "#fafafa",
  surface: "#ffffff",
  bone: "#fafafa",
  card: "#ffffff",
  ink: "#171717",
  body: "#666666",
  mute: "#666666",
  stone: "#808080",
  divider: "#ebebeb",
  hairline: "#ebebeb",
  focus: "#0072f5",
  info: "#0072f5",
  infoSurface: "#e8f1ff",
  success: "#2b9a66",
  successSurface: "#e9f5ee",
  danger: "#ff5b4f",
  warning: "#d97706",
  warningSurface: "#fff4e5",
  warningText: "#8a5a00",
  link: "#0072f5",
  mutedSurface: "#f2f2f2",
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
  brand: "#0072f5",
  onBrand: "#ffffff",
  canvas: "#0a0a0a",
  surface: "#0a0a0a",
  bone: "#111111",
  card: "#0a0a0a",
  mutedSurface: "#1a1a1a",
  ink: "#ededed",
  body: "#a0a0a0",
  mute: "#808080",
  stone: "#666666",
  divider: "#2a2a2a",
  hairline: "rgba(255,255,255,0.1)",
  focus: "#0072f5",
  info: "#4d9bff",
  infoSurface: "#10233f",
  success: "#2b9a66",
  successSurface: "#11281f",
  danger: "#ff5b4f",
  warning: "#d97706",
  warningSurface: "#33250c",
  warningText: "#f2b866",
  link: "#0072f5",
  disabledSurface: "#111111",
  disabledText: "#666666",
};

export const spacing = {
  base: 8,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  page: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

const radiusScale = {
  none: 0,
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  full: 9999,
} as const;

export const radius = {
  ...radiusScale,
  input: radiusScale.sm,
  button: radiusScale.sm,
  card: radiusScale.md,
  alert: radiusScale.md,
  pill: radiusScale.full,
  navigation: 32,
  avatar: radiusScale.full,
} as const;

export const fontFamilies = {
  display: "Geist",
  body: "Poppins",
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
} as const;

export const layout = {
  referenceScreen: { width: 390, height: 844 },
  screen: { gutter: 20, maxContentWidth: 350 },
  auth: {
    gutter: 32,
    maxContentWidth: 326,
    wordmark: { width: 224, height: 80 },
  },
  statusBarHeight: 62,
  controlHeight: 48,
  primaryButtonHeight: 50,
  compactButtonHeight: 36,
  minTouchTarget: 44,
  wizardStepSize: 24,
  splashLogoSize: 96,
  avatarSize: 38,
  statusPillHeight: 26,
  serviceRowHeight: 68,
  photoTile: {
    width: 102,
    height: 92,
    compactWidth: 72,
    compactHeight: 38,
  },
  bottomNavigation: {
    areaHeight: 74,
    width: 358,
    height: 64,
    gutter: 16,
  },
  icon: {
    inline: 16,
    navigation: 20,
    action: 22,
    primaryAction: 24,
  },
} as const;

export interface ShadowToken {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const shadows = {
  none: {
    shadowColor: "transparent",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  subtle: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  elevated: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
} as const satisfies Record<string, ShadowToken>;

export const typography = {
  display: {
    fontFamily: fontFamilies.display,
    fontSize: 30,
    fontWeight: "600",
    lineHeight: 33,
  },
  headingLg: {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.96,
    lineHeight: 32,
  },
  headingMd: {
    fontFamily: fontFamilies.display,
    fontSize: 32,
    fontWeight: "600",
    letterSpacing: -1.28,
    lineHeight: 40,
  },
  headingSm: {
    fontFamily: fontFamilies.display,
    fontSize: 24,
    fontWeight: "600",
    letterSpacing: -0.96,
    lineHeight: 32,
  },
  screenTitle: {
    fontFamily: fontFamilies.display,
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: -0.44,
    lineHeight: 28,
  },
  section: {
    fontFamily: fontFamilies.display,
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 24,
  },
  title: {
    fontFamily: fontFamilies.display,
    fontSize: 20,
    fontWeight: "600",
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  subtitle: {
    fontFamily: fontFamilies.display,
    fontSize: 16,
    fontWeight: "500",
    lineHeight: 24,
  },
  body: {
    fontFamily: fontFamilies.body,
    fontSize: 16,
    fontWeight: "400",
    lineHeight: 24,
  },
  bodyUi: {
    fontFamily: fontFamilies.display,
    fontSize: 14,
    fontWeight: "400",
    lineHeight: 20,
  },
  button: {
    fontFamily: fontFamilies.display,
    fontSize: 14,
    fontWeight: "500",
    lineHeight: 20,
  },
  nav: {
    fontFamily: fontFamilies.display,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
  label: {
    fontFamily: fontFamilies.display,
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
  overline: {
    fontFamily: fontFamilies.display,
    fontSize: 10,
    fontWeight: "500",
    letterSpacing: 0.2,
    lineHeight: 14,
  },
  caption: {
    fontFamily: fontFamilies.display,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  mono: {
    fontFamily: fontFamilies.mono,
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
} as const;

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof spacing;
  radius: typeof radius;
  fontFamilies: typeof fontFamilies;
  layout: typeof layout;
  shadows: typeof shadows;
  typography: typeof typography;
}

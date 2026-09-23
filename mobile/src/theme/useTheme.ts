import {
  DarkTheme,
  DefaultTheme,
  type Theme as NavigationTheme,
} from "@react-navigation/native";
import { useMemo } from "react";
import { useColorScheme } from "react-native";
import {
  darkColors,
  fontFamilies,
  lightColors,
  layout,
  radius,
  shadows,
  spacing,
  typography,
  type Theme,
} from "./tokens";

export const lightTheme: Theme = {
  isDark: false,
  colors: lightColors,
  fontFamilies,
  layout,
  spacing,
  radius,
  shadows,
  typography,
};

export const darkTheme: Theme = {
  isDark: true,
  colors: darkColors,
  fontFamilies,
  layout,
  spacing,
  radius,
  shadows,
  typography,
};

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === "dark" ? darkTheme : lightTheme;
}

export function useThemedStyles<T>(factory: (theme: Theme) => T): T {
  const theme = useTheme();
  return useMemo(() => factory(theme), [factory, theme]);
}

export function buildNavigationTheme(theme: Theme): NavigationTheme {
  const base = theme.isDark ? DarkTheme : DefaultTheme;

  return {
    ...base,
    colors: {
      ...base.colors,
      primary: theme.colors.primary,
      background: theme.colors.canvas,
      card: theme.colors.canvas,
      text: theme.colors.ink,
      border: theme.colors.divider,
      notification: theme.colors.danger,
    },
  };
}

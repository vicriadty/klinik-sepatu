import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ComponentProps } from "react";

export type NativeIconName =
  | "home"
  | "clipboard"
  | "users"
  | "loader"
  | "package"
  | "clock"
  | "plus"
  | "search"
  | "calendar"
  | "chevron"
  | "chevronDown"
  | "history"
  | "settings"
  | "logout";

type MaterialCommunityIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

const iconNames: Record<NativeIconName, MaterialCommunityIconName> = {
  home: "home",
  clipboard: "clipboard-text",
  users: "account-group",
  loader: "progress-clock",
  package: "package-variant",
  clock: "clock-outline",
  plus: "plus",
  search: "magnify",
  calendar: "calendar-month-outline",
  chevron: "chevron-right",
  chevronDown: "chevron-down",
  history: "history",
  settings: "cog-outline",
  logout: "logout",
};

interface NativeIconProps {
  name: NativeIconName;
  color: string;
  size?: number;
  accessibilityLabel?: string;
}

export default function NativeIcon({
  name,
  color,
  size = 22,
  accessibilityLabel,
}: NativeIconProps) {
  return (
    <MaterialCommunityIcons
      name={iconNames[name]}
      size={size}
      color={color}
      accessibilityLabel={accessibilityLabel}
    />
  );
}

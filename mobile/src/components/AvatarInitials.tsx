import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

interface AvatarInitialsProps {
  initials: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export default function AvatarInitials({
  initials,
  size,
  style,
  accessibilityLabel,
}: AvatarInitialsProps) {
  const styles = useThemedStyles(createStyles);
  const avatarSize = size ?? styles.avatar.width;

  return (
    <View
      accessibilityLabel={accessibilityLabel ?? initials}
      style={[styles.avatar, { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }, style]}
    >
      <Text style={styles.label}>{initials.slice(0, 2).toUpperCase()}</Text>
    </View>
  );
}

const createStyles = ({ colors, layout, typography }: Theme) =>
  StyleSheet.create({
    avatar: {
      width: layout.avatarSize,
      height: layout.avatarSize,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: layout.avatarSize / 2,
      backgroundColor: colors.infoSurface,
    },
    label: {
      ...typography.label,
      color: colors.link,
    },
  });

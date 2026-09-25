import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  backIcon?: ReactNode;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function ScreenHeader({
  title,
  subtitle,
  onBack,
  backIcon,
  right,
  style,
}: ScreenHeaderProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.container, style]}>
      {onBack ? (
        <Pressable
          accessibilityLabel="Kembali"
          accessibilityRole="button"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          {backIcon ?? <Text style={styles.defaultBackIcon}>←</Text>}
        </Pressable>
      ) : null}
      <View style={styles.titleGroup}>
        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    container: {
      minHeight: layout.minTouchTarget,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      paddingHorizontal: layout.screen.gutter,
      paddingTop: layout.statusBarHeight + spacing.md,
    },
    backButton: {
      width: layout.minTouchTarget,
      height: layout.minTouchTarget,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -spacing.xs,
      borderRadius: radius.full,
    },
    defaultBackIcon: {
      ...typography.bodyUi,
      color: colors.ink,
      fontSize: layout.icon.action,
      lineHeight: layout.icon.action + spacing.xs,
    },
    titleGroup: {
      flex: 1,
      gap: spacing.xxs,
    },
    title: {
      ...typography.screenTitle,
      color: colors.ink,
    },
    subtitle: {
      ...typography.caption,
      color: colors.mute,
    },
    right: {
      alignItems: "flex-end",
      justifyContent: "center",
    },
    pressed: {
      opacity: 0.6,
    },
  });

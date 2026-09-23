import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

export type NoticeTone = "neutral" | "info" | "success" | "warning" | "danger";

interface NoticeBannerProps {
  message: string;
  title?: string;
  tone?: NoticeTone;
  icon?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function NoticeBanner({
  message,
  title,
  tone = "neutral",
  icon,
  actionLabel,
  onAction,
  style,
}: NoticeBannerProps) {
  const styles = useThemedStyles(createStyles);
  const toneStyles = getToneStyles(tone, styles);
  const action = actionLabel && onAction ? (
    <Pressable
      accessibilityRole="button"
      onPress={onAction}
      style={({ pressed }) => [styles.action, pressed && styles.pressed]}
    >
      <Text style={[styles.actionLabel, toneStyles.text]}>{actionLabel}</Text>
    </Pressable>
  ) : null;

  return (
    <View style={[styles.container, toneStyles.container, style]}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <View style={styles.content}>
        {title ? <Text style={[styles.title, toneStyles.text]}>{title}</Text> : null}
        <Text style={[styles.message, toneStyles.text]}>{message}</Text>
      </View>
      {action}
    </View>
  );
}

const getToneStyles = (tone: NoticeTone, styles: ReturnType<typeof createStyles>) => {
  const toneStyles = {
    neutral: { container: styles.neutralTone, text: styles.neutralText },
    info: { container: styles.infoTone, text: styles.infoText },
    success: { container: styles.successTone, text: styles.successText },
    warning: { container: styles.warningTone, text: styles.warningText },
    danger: { container: styles.dangerTone, text: styles.dangerText },
  }[tone];

  return toneStyles;
};

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    container: {
      minHeight: layout.minTouchTarget,
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.alert,
      borderWidth: 1,
    },
    neutralTone: {
      backgroundColor: colors.bone,
      borderColor: colors.divider,
    },
    neutralText: { color: colors.mute },
    infoTone: {
      backgroundColor: colors.infoSurface,
      borderColor: colors.info,
    },
    infoText: { color: colors.info },
    successTone: {
      backgroundColor: colors.successSurface,
      borderColor: colors.success,
    },
    successText: { color: colors.success },
    warningTone: {
      backgroundColor: colors.warningSurface,
      borderColor: colors.warning,
    },
    warningText: { color: colors.warningText },
    dangerTone: {
      backgroundColor: colors.warningSurface,
      borderColor: colors.danger,
    },
    dangerText: { color: colors.danger },
    icon: {
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
      gap: spacing.xxs,
    },
    title: {
      ...typography.label,
    },
    message: {
      ...typography.bodyUi,
    },
    action: {
      minHeight: layout.minTouchTarget,
      justifyContent: "center",
    },
    actionLabel: {
      ...typography.caption,
    },
    pressed: {
      opacity: 0.65,
    },
  });

import { StyleSheet, Text, View } from "react-native";
import AppButton from "./AppButton";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

interface EmptyStateProps {
  title: string;
  message?: string;
  actionTitle?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title,
  message,
  actionTitle,
  onAction,
}: EmptyStateProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionTitle && onAction ? (
        <AppButton
          title={actionTitle}
          variant="secondary"
          size="compact"
          onPress={onAction}
        />
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: Theme) =>
  StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.lg,
      gap: spacing.xs,
    },
    title: {
      ...typography.subtitle,
      color: colors.ink,
      textAlign: "center",
    },
    message: {
      ...typography.body,
      color: colors.mute,
      textAlign: "center",
    },
  });

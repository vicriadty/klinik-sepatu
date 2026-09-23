import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

export type StatusHistoryState = "complete" | "current" | "pending";

export interface StatusHistoryEntry {
  label: string;
  timestamp?: string;
  description?: string;
  state?: StatusHistoryState;
}

interface StatusHistoryProps {
  entries: readonly StatusHistoryEntry[];
  style?: StyleProp<ViewStyle>;
}

export default function StatusHistory({ entries, style }: StatusHistoryProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.container, style]}>
      {entries.map((entry, index) => {
        const state = entry.state ?? (index === entries.length - 1 ? "current" : "complete");
        return (
          <View key={`${entry.label}-${index}`} style={styles.row}>
            <View style={styles.markerColumn}>
              <View style={[styles.marker, styles[`${state}Marker`]]}>
                {state === "complete" ? <Text style={styles.check}>✓</Text> : null}
              </View>
              {index < entries.length - 1 ? (
                <View style={[styles.line, state === "complete" && styles.lineComplete]} />
              ) : null}
            </View>
            <View style={styles.content}>
              <View style={styles.heading}>
                <Text style={[styles.label, state === "pending" && styles.pendingText]}>
                  {entry.label}
                </Text>
                {entry.timestamp ? <Text style={styles.timestamp}>{entry.timestamp}</Text> : null}
              </View>
              {entry.description ? (
                <Text style={styles.description}>{entry.description}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    row: {
      minHeight: layout.minTouchTarget,
      flexDirection: "row",
      gap: spacing.md,
    },
    markerColumn: {
      width: layout.icon.action,
      alignItems: "center",
    },
    marker: {
      width: layout.icon.inline + spacing.xs / 2,
      height: layout.icon.inline + spacing.xs / 2,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      borderWidth: 1,
    },
    completeMarker: {
      borderColor: colors.success,
      backgroundColor: colors.success,
    },
    currentMarker: {
      borderColor: colors.link,
      backgroundColor: colors.infoSurface,
    },
    pendingMarker: {
      borderColor: colors.hairline,
      backgroundColor: colors.surface,
    },
    check: {
      color: colors.onPrimary,
      ...typography.caption,
    },
    line: {
      flex: 1,
      width: 1,
      marginVertical: spacing.xs,
      backgroundColor: colors.divider,
    },
    lineComplete: {
      backgroundColor: colors.success,
    },
    content: {
      flex: 1,
      gap: spacing.xxs,
      paddingBottom: spacing.sm,
    },
    heading: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: spacing.md,
    },
    label: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    pendingText: {
      color: colors.mute,
    },
    timestamp: {
      ...typography.caption,
      color: colors.mute,
    },
    description: {
      ...typography.caption,
      color: colors.body,
    },
  });

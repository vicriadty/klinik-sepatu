import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

interface WizardProgressProps {
  step: number;
  total?: number;
  labels?: readonly string[];
  onStepPress?: (step: number) => void;
  style?: StyleProp<ViewStyle>;
}

export default function WizardProgress({
  step,
  total = 5,
  labels,
  onStepPress,
  style,
}: WizardProgressProps) {
  const styles = useThemedStyles(createStyles);
  const currentStep = Math.max(1, Math.min(step, total));
  const defaultLabels = ["Pelanggan", "Sepatu", "Layanan", "Foto", "Review"];
  const stepLabels = labels ?? defaultLabels;

  return (
    <View
      accessibilityLabel={`Langkah ${currentStep} dari ${total}`}
      style={[styles.container, style]}
    >
      <Text style={styles.label}>
        Langkah {currentStep} dari {total}
      </Text>
      <View style={styles.track}>
        {Array.from({ length: total }, (_, index) => (
          <View key={index} style={styles.stepGroup}>
            <Pressable
              accessibilityLabel={stepLabels[index] ?? `Langkah ${index + 1}`}
              accessibilityRole={onStepPress ? "button" : "text"}
              disabled={!onStepPress}
              onPress={() => onStepPress?.(index + 1)}
              style={({ pressed }) => [
                styles.step,
                index + 1 < currentStep && styles.stepComplete,
                index + 1 === currentStep && styles.stepCurrent,
                index + 1 > currentStep && styles.stepUpcoming,
                pressed && styles.pressed,
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  index + 1 <= currentStep && styles.stepTextActive,
                ]}
              >
                {index + 1 < currentStep ? "✓" : index + 1}
              </Text>
            </Pressable>
            <Text numberOfLines={1} style={styles.stepLabel}>
              {stepLabels[index] ?? `Langkah ${index + 1}`}
            </Text>
          </View>
        ))}
      </View>
      <View pointerEvents="none" style={styles.connectors}>
        {Array.from({ length: Math.max(0, total - 1) }, (_, index) => (
          <View
            key={index}
            style={[styles.connector, index + 1 < currentStep && styles.connectorComplete]}
          />
        ))}
      </View>
    </View>
  );
}

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    container: {
      position: "relative",
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    label: {
      ...typography.caption,
      color: colors.mute,
    },
    track: {
      flexDirection: "row",
      justifyContent: "space-between",
      zIndex: 1,
    },
    stepGroup: {
      flex: 1,
      alignItems: "center",
      gap: spacing.xs,
    },
    step: {
      width: layout.wizardStepSize,
      height: layout.wizardStepSize,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      borderWidth: 1,
    },
    stepComplete: {
      borderColor: colors.success,
      backgroundColor: colors.success,
    },
    stepCurrent: {
      borderColor: colors.ink,
      backgroundColor: colors.ink,
    },
    stepUpcoming: {
      borderColor: colors.divider,
      backgroundColor: colors.surface,
    },
    stepText: {
      ...typography.caption,
      color: colors.mute,
    },
    stepTextActive: {
      color: colors.onPrimary,
    },
    stepLabel: {
      ...typography.caption,
      color: colors.mute,
      textAlign: "center",
    },
    connectors: {
      position: "absolute",
      top: spacing.xl + spacing.md,
      left: layout.wizardStepSize / 2,
      right: layout.wizardStepSize / 2,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    connector: {
      flex: 1,
      height: 1,
      marginHorizontal: spacing.xs,
      backgroundColor: colors.divider,
    },
    connectorComplete: {
      backgroundColor: colors.success,
    },
    pressed: {
      opacity: 0.7,
    },
  });

import { type ReactNode } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

export type PhotoTileState = "empty" | "captured" | "uploading" | "failed";

interface PhotoTileProps {
  label: string;
  state?: PhotoTileState;
  imageUri?: string;
  subtitle?: string;
  compact?: boolean;
  icon?: ReactNode;
  onPress?: () => void;
  onRemove?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function PhotoTile({
  label,
  state = "empty",
  imageUri,
  subtitle,
  compact = false,
  icon,
  onPress,
  onRemove,
  style,
}: PhotoTileProps) {
  const styles = useThemedStyles(createStyles);
  const tileStyle = compact ? styles.compact : styles.standard;
  const showImage = state === "captured" && imageUri;

  const content = showImage ? (
    <Image accessibilityLabel={label} source={{ uri: imageUri }} style={styles.image} />
  ) : state === "uploading" ? (
    <ActivityIndicator color={styles.spinner.color} />
  ) : (
    <View style={styles.emptyContent}>
      {icon ?? <Text style={styles.plus}>+</Text>}
      {!compact ? <Text style={styles.label}>{label}</Text> : null}
      {!compact && subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {state === "failed" ? <Text style={styles.failed}>Coba lagi</Text> : null}
    </View>
  );

  return (
    <View style={[tileStyle, style]}>
      <Pressable
        accessibilityLabel={label}
        accessibilityRole={onPress ? "button" : "image"}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
      {onRemove && state === "captured" ? (
        <Pressable
          accessibilityLabel={`Hapus ${label}`}
          accessibilityRole="button"
          onPress={onRemove}
          style={styles.remove}
        >
          <Text style={styles.removeLabel}>×</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const createStyles = ({ colors, layout, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    standard: {
      width: layout.photoTile.width,
      height: layout.photoTile.height,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.card,
      backgroundColor: colors.bone,
    },
    compact: {
      width: layout.photoTile.compactWidth,
      height: layout.photoTile.compactHeight,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.xs,
      backgroundColor: colors.bone,
    },
    pressable: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
    },
    image: {
      width: "100%",
      height: "100%",
      resizeMode: "cover",
    },
    emptyContent: {
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xxs,
    },
    plus: {
      ...typography.headingSm,
      color: colors.link,
      fontWeight: "400",
    },
    label: {
      ...typography.caption,
      color: colors.ink,
      textAlign: "center",
    },
    subtitle: {
      ...typography.caption,
      color: colors.mute,
      textAlign: "center",
    },
    failed: {
      ...typography.caption,
      color: colors.danger,
    },
    spinner: {
      color: colors.link,
    },
    remove: {
      position: "absolute",
      top: spacing.xs,
      right: spacing.xs,
      width: spacing.xl,
      height: spacing.xl,
      alignItems: "center",
      justifyContent: "center",
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    removeLabel: {
      ...typography.bodyUi,
      color: colors.onPrimary,
    },
    pressed: {
      opacity: 0.7,
    },
  });

import { type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import SurfaceCard from "./SurfaceCard";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

interface ShoeItemCardProps {
  title: string;
  brand?: string;
  model?: string;
  type?: string;
  color?: string;
  size?: string;
  note?: string;
  price?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  onEdit?: () => void;
  onRemove?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function ShoeItemCard({
  title,
  brand,
  model,
  type,
  color,
  size,
  note,
  price,
  leading,
  trailing,
  onPress,
  onEdit,
  onRemove,
  style,
}: ShoeItemCardProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <SurfaceCard
      accessibilityLabel={title}
      onPress={onPress ? () => onPress() : undefined}
      style={style}
      variant="compact"
    >
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          {leading ? <View style={styles.leading}>{leading}</View> : null}
          <View style={styles.content}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            {brand || model ? (
              <Text style={styles.subtitle}>{[brand, model].filter(Boolean).join(" · ")}</Text>
            ) : null}
          </View>
        </View>
        {price ? <Text style={styles.price}>{price}</Text> : null}
        {trailing ? <View>{trailing}</View> : null}
      </View>
      {type || color || size ? (
        <View style={styles.details}>
          {type ? <Detail label="Jenis" value={type} styles={styles} /> : null}
          {color ? <Detail label="Warna" value={color} styles={styles} /> : null}
          {size ? <Detail label="Ukuran" value={size} styles={styles} /> : null}
        </View>
      ) : null}
      {note ? <Text style={styles.note}>{note}</Text> : null}
      {onEdit || onRemove ? (
        <View style={styles.actions}>
          {onEdit ? (
            <Pressable accessibilityRole="button" onPress={onEdit} style={styles.actionButton}>
              <Text style={styles.actionLabel}>Edit</Text>
            </Pressable>
          ) : null}
          {onRemove ? (
            <Pressable accessibilityRole="button" onPress={onRemove} style={styles.actionButton}>
              <Text style={styles.removeLabel}>Hapus</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </SurfaceCard>
  );
}

function Detail({
  label,
  value,
  styles,
}: {
  label: string;
  value: string;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text numberOfLines={1} style={styles.detailValue}>
        {value}
      </Text>
    </View>
  );
}

const createStyles = ({ colors, spacing, typography }: Theme) =>
  StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
    },
    titleGroup: {
      flex: 1,
      flexDirection: "row",
      gap: spacing.sm,
    },
    leading: {
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
      gap: spacing.xxs,
    },
    title: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    subtitle: {
      ...typography.caption,
      color: colors.mute,
    },
    price: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    details: {
      flexDirection: "row",
      gap: spacing.xl,
      marginTop: spacing.md,
    },
    detail: {
      gap: spacing.xxs,
    },
    detailLabel: {
      ...typography.caption,
      color: colors.stone,
    },
    detailValue: {
      ...typography.bodyUi,
      color: colors.body,
    },
    note: {
      ...typography.caption,
      color: colors.mute,
      marginTop: spacing.md,
    },
    actions: {
      flexDirection: "row",
      justifyContent: "flex-end",
      gap: spacing.md,
      marginTop: spacing.md,
    },
    actionButton: {
      minHeight: spacing.xl,
      justifyContent: "center",
    },
    actionLabel: {
      ...typography.caption,
      color: colors.link,
    },
    removeLabel: {
      ...typography.caption,
      color: colors.danger,
    },
  });

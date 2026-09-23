import { type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { StyleProp, ViewStyle } from "react-native";
import AvatarInitials from "./AvatarInitials";
import SurfaceCard from "./SurfaceCard";
import type { Theme } from "../theme/tokens";
import { useThemedStyles } from "../theme/useTheme";

interface CustomerRowProps {
  name: string;
  secondary?: string;
  meta?: string;
  initials?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export default function CustomerRow({
  name,
  secondary,
  meta,
  initials,
  leading,
  trailing,
  selected = false,
  onPress,
  style,
}: CustomerRowProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <SurfaceCard
      accessibilityLabel={name}
      onPress={onPress ? () => onPress() : undefined}
      style={[styles.card, selected && styles.selected, style]}
      variant="compact"
    >
      {leading ?? (initials ? <AvatarInitials initials={initials} /> : null)}
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.name}>
          {name}
        </Text>
        {secondary ? (
          <Text numberOfLines={1} style={styles.secondary}>
            {secondary}
          </Text>
        ) : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </SurfaceCard>
  );
}

const createStyles = ({ colors, radius, spacing, typography }: Theme) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
      borderRadius: radius.card,
    },
    selected: {
      borderColor: colors.link,
      backgroundColor: colors.infoSurface,
    },
    content: {
      flex: 1,
      gap: spacing.xxs,
    },
    name: {
      ...typography.bodyUi,
      color: colors.ink,
    },
    secondary: {
      ...typography.caption,
      color: colors.mute,
    },
    meta: {
      ...typography.caption,
      color: colors.stone,
    },
    trailing: {
      alignItems: "flex-end",
      justifyContent: "center",
    },
  });

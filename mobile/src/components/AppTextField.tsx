import { forwardRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import type { Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/useTheme";

interface AppTextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

const AppTextField = forwardRef<TextInput, AppTextFieldProps>(
  ({ label, error, style, onFocus, onBlur, ...inputProps }, ref) => {
    const theme = useTheme();
    const styles = useThemedStyles(createStyles);
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}</Text>
        <TextInput
          ref={ref}
          style={[
            styles.input,
            focused && styles.inputFocused,
            error ? styles.inputError : null,
            style,
          ]}
          placeholderTextColor={theme.colors.stone}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          {...inputProps}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  }
);

AppTextField.displayName = "AppTextField";

const createStyles = ({
  colors,
  radius,
  spacing,
  typography,
}: Theme) =>
  StyleSheet.create({
    container: {
      gap: spacing.xs,
    },
    label: {
      ...typography.caption,
      color: colors.mute,
    },
    input: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.sm,
      paddingHorizontal: 20,
      ...typography.body,
      color: colors.ink,
      backgroundColor: colors.card,
    },
    inputFocused: {
      borderColor: colors.ink,
    },
    inputError: {
      borderColor: colors.danger,
    },
    error: {
      ...typography.caption,
      color: colors.danger,
    },
  });

export default AppTextField;

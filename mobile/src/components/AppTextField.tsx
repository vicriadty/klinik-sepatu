import { forwardRef, useState, type ReactNode } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from "react-native";
import type { StyleProp, TextStyle, ViewStyle } from "react-native";
import type { Theme } from "../theme/tokens";
import { useTheme, useThemedStyles } from "../theme/useTheme";

interface AppTextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
  inputContainerStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

const AppTextField = forwardRef<TextInput, AppTextFieldProps>(
  (
    {
      label,
      error,
      hint,
      leading,
      trailing,
      style,
      containerStyle,
      inputContainerStyle,
      labelStyle,
      onFocus,
      onBlur,
      ...inputProps
    },
    ref
  ) => {
    const theme = useTheme();
    const styles = useThemedStyles(createStyles);
    const [focused, setFocused] = useState(false);

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? <Text style={[styles.label, labelStyle]}>{label}</Text> : null}
        <View
          style={[
            styles.inputContainer,
            focused && styles.inputFocused,
            error ? styles.inputError : null,
            inputProps.editable === false && styles.inputDisabled,
            inputContainerStyle,
          ]}
        >
          {leading ? <View style={styles.leading}>{leading}</View> : null}
          <TextInput
            ref={ref}
            style={[styles.input, style]}
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
          {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {!error && hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    );
  }
);

AppTextField.displayName = "AppTextField";

const createStyles = ({
  colors,
  layout,
  radius,
  spacing,
  typography,
}: Theme) =>
  StyleSheet.create({
    container: {
      gap: spacing.xs,
    },
    label: {
      ...typography.label,
      color: colors.ink,
    },
    inputContainer: {
      minHeight: 48,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: radius.input,
      paddingHorizontal: spacing.md,
      backgroundColor: colors.surface,
    },
    input: {
      flex: 1,
      minHeight: layout.controlHeight - spacing.xs / 2,
      paddingHorizontal: 0,
      paddingVertical: spacing.sm,
      ...typography.body,
      color: colors.ink,
    },
    inputFocused: {
      borderColor: colors.focus,
    },
    inputError: {
      borderColor: colors.danger,
    },
    inputDisabled: {
      backgroundColor: colors.disabledSurface,
    },
    leading: {
      marginRight: spacing.sm,
    },
    trailing: {
      marginLeft: spacing.sm,
    },
    error: {
      ...typography.caption,
      color: colors.danger,
    },
    hint: {
      ...typography.caption,
      color: colors.mute,
    },
  });

export default AppTextField;

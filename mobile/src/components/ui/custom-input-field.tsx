import type { Ref } from "react";
import { TextInput, type TextInputProps } from "react-native";
import { useTheme } from "@/hooks/use-theme";

type CustomInputFieldProps = TextInputProps & { ref?: Ref<TextInput> };

export function CustomInputField({
  style,
  ref,
  ...rest
}: CustomInputFieldProps) {
  const theme = useTheme();
  return (
    <TextInput
      ref={ref}
      placeholderTextColor={theme.textSecondary}
      style={[
        {
          color: theme.text,
          fontSize: 14,
          lineHeight: 24,
          fontWeight: 500,
          alignItems: "center",
          height: 54,
          paddingHorizontal: 16,
          borderRadius: 16,
          borderColor: theme.textSecondary,
          borderWidth: 2,
          width: "100%",
        },
        style,
      ]}
      {...rest}
    />
  );
}

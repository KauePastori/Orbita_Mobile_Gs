import { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../constants/theme";

type Props = {
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  icon?: string;        // nome do ícone Ionicons
  isPassword?: boolean; // se true, mostra o olho
};

export default function UIInput({
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  icon,
  isPassword,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  const isSecure = isPassword ? !showPassword : secureTextEntry;

  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        {icon && (
          <Ionicons
            name={icon as any}
            size={20}
            color={COLORS.textMuted}
            style={styles.iconLeft}
          />
        )}

        <TextInput
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          style={[styles.input, icon && { paddingLeft: 40 }]}
          secureTextEntry={isSecure}
          value={value}
          onChangeText={onChangeText}
        />

        {isPassword && (
          <TouchableOpacity
            style={styles.iconRight}
            onPress={() => setShowPassword((prev) => !prev)}
          >
            <Ionicons
              name={showPassword ? "eye-off-outline" : "eye-outline"}
              size={20}
              color={COLORS.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: SIZES.md,
  },
  inner: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: SIZES.sm,
  },
  input: {
    flex: 1,
    color: COLORS.textLight,
    fontSize: 16,
    paddingVertical: SIZES.sm,
  },
  iconLeft: {
    marginRight: 6,
  },
  iconRight: {
    marginLeft: 6,
  },
});

import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { COLORS, SIZES } from "../constants/theme";

export default function UIButton({ title, onPress }: any) {
  return (
    <TouchableOpacity style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: SIZES.md,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: SIZES.md,
  },
  text: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: "600",
  },
});

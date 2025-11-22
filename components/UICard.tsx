import { View, Text, StyleSheet } from "react-native";
import { COLORS, SIZES } from "../constants/theme";

export default function UICard({ title, description }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    padding: SIZES.lg,
    borderRadius: 14,
    marginVertical: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  title: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: "bold",
  },
  description: {
    marginTop: 4,
    color: COLORS.textMuted,
    fontSize: 15,
  },
});

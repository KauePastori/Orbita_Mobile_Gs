import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../constants/theme";
import UIButton from "../components/UIButton";
import { auth, db } from "../services/firebase";
import { ref, set } from "firebase/database";

type Option = {
  id: string;
  label: string;
};

const AREAS: Option[] = [
  { id: "dados", label: "Dados & Análise" },
  { id: "ia", label: "Inteligência Artificial" },
  { id: "cx", label: "Experiência do Cliente" },
  { id: "verde", label: "Carreiras Verdes" },
];

const TEMPOS: Option[] = [
  { id: "3", label: "Até 3h / semana" },
  { id: "5", label: "3 a 5h / semana" },
  { id: "10", label: "5 a 10h / semana" },
];

const NIVEIS: Option[] = [
  { id: "iniciante", label: "Iniciante" },
  { id: "intermediario", label: "Intermediário" },
  { id: "avancado", label: "Avançado" },
];

export default function OnboardingScreen() {
  const [area, setArea] = useState<string | null>(null);
  const [tempo, setTempo] = useState<string | null>(null);
  const [nivel, setNivel] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const podeContinuar = area && tempo && nivel;

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardTranslateY]);

  const handleContinuar = async () => {
    if (!podeContinuar) {
      Alert.alert("Quase lá", "Responda as 3 perguntas para continuar. 🙂");
      return;
    }

    const user = auth.currentUser;

    if (!user) {
      Alert.alert(
        "Sessão expirada",
        "Faça login novamente para continuar."
      );
      router.replace("/");
      return;
    }

    try {
      setLoading(true);

      const profileRef = ref(db, `users/${user.uid}/profile`);

      await set(profileRef, {
        nome: user.displayName || "",
        email: user.email,
        areaInteresse: area,
        tempoDisponivel: tempo,
        nivel,
        updatedAt: new Date().toISOString(),
      });

      router.replace("/(tabs)");
    } catch (error: any) {
      console.log(error);
      Alert.alert(
        "Erro ao salvar",
        error?.message || "Não foi possível salvar suas preferências."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View style={styles.logoCircle}>
          <Ionicons
            name="rocket-outline"
            size={24}
            color={COLORS.textLight}
          />
        </View>

        <View style={styles.headerTextArea}>
          <Text style={styles.title}>Configurar sua ÓRBITA</Text>
          <Text style={styles.subtitle}>
            Responda 3 perguntas para personalizar suas rotas de carreira.
          </Text>
        </View>

        <View style={styles.stepPill}>
          <Text style={styles.stepText}>Passo 1 de 1</Text>
        </View>
      </View>

      <View style={styles.cardWrapper}>
        <Animated.View
          style={[
            styles.card,
            { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] },
          ]}
        >
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Área de interesse */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                1. Em qual área você quer focar primeiro?
              </Text>
              <Text style={styles.sectionSubtitle}>
                Escolha a área que mais combina com o momento da sua carreira.
              </Text>
              <View style={styles.chipsContainer}>
                {AREAS.map((opt) => (
                  <Chip
                    key={opt.id}
                    label={opt.label}
                    selected={area === opt.id}
                    onPress={() => setArea(opt.id)}
                  />
                ))}
              </View>
            </View>

            {/* Tempo disponível */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                2. Quanto tempo você consegue dedicar por semana?
              </Text>
              <Text style={styles.sectionSubtitle}>
                Isso ajuda a ÓRBITA a sugerir missões realistas pra você.
              </Text>
              <View style={styles.chipsContainer}>
                {TEMPOS.map((opt) => (
                  <Chip
                    key={opt.id}
                    label={opt.label}
                    selected={tempo === opt.id}
                    onPress={() => setTempo(opt.id)}
                  />
                ))}
              </View>
            </View>

            {/* Nível atual */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                3. Como você se considera hoje?
              </Text>
              <Text style={styles.sectionSubtitle}>
                Não tem resposta certa — seja sincero pra receber recomendações melhores.
              </Text>
              <View style={styles.chipsContainer}>
                {NIVEIS.map((opt) => (
                  <Chip
                    key={opt.id}
                    label={opt.label}
                    selected={nivel === opt.id}
                    onPress={() => setNivel(opt.id)}
                  />
                ))}
              </View>
            </View>

            <View style={{ marginTop: SIZES.xl, width: "100%" }}>
              <UIButton
                title={loading ? "Salvando..." : "Continuar para a ÓRBITA"}
                onPress={handleContinuar}
              />
            </View>

            <Text style={styles.helperText}>
              Você poderá ajustar essas preferências depois, na aba Meu Futuro.
            </Text>
          </ScrollView>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress: () => void;
};

function Chip({ label, selected, onPress }: ChipProps) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.lg,
    paddingTop: 48,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.lg,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#020617",
  },
  headerTextArea: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    color: COLORS.textLight,
    fontSize: 20,
    fontWeight: "bold",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  stepPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#020617",
  },
  stepText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  cardWrapper: {
    flex: 1,
    marginTop: SIZES.sm,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    paddingVertical: SIZES.lg,
    paddingHorizontal: SIZES.lg,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    color: COLORS.textLight,
    fontSize: 15,
    fontWeight: "600",
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: SIZES.sm,
  },
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
    marginBottom: 8,
    backgroundColor: "#020617",
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
  chipTextSelected: {
    color: COLORS.textLight,
    fontWeight: "600",
  },
  helperText: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: SIZES.sm,
    textAlign: "center",
  },
});

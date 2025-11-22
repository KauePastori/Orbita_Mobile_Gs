import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Animated,
  Easing,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { signOut } from "firebase/auth";
import { onValue, ref, update } from "firebase/database";

import { COLORS, SIZES } from "../../constants/theme";
import { auth, db } from "../../services/firebase";

type Profile = {
  nome?: string;
  email?: string;
  areaInteresse?: string;
  tempoDisponivel?: string;
  nivel?: string;
  headline?: string;
  bio?: string;
};

const AREA_LABELS: Record<string, string> = {
  dados: "Dados & Análise",
  ia: "Inteligência Artificial",
  cx: "Experiência do Cliente",
  verde: "Carreiras Verdes",
};

const NIVEL_LABELS: Record<string, string> = {
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

function getInitials(name?: string | null) {
  if (!name) return "ÓR";
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  const first = parts[0].charAt(0).toUpperCase();
  const last = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first}${last}`;
}

export default function ProfileScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);

  const [headline, setHeadline] = useState("");
  const [bio, setBio] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const profileRef = ref(db, `users/${user.uid}/profile`);

    const unsubProfile = onValue(profileRef, (snapshot) => {
      const data = (snapshot.val() || {}) as Profile;
      setProfile(data);
      setHeadline(data.headline || "");
      setBio(data.bio || "");
    });

    return () => {
      unsubProfile();
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 450,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslateY]);

  const handleSaveProfile = async () => {
    const user = auth.currentUser;
    if (!user || !profile) return;

    try {
      setSaving(true);
      const profileRef = ref(db, `users/${user.uid}/profile`);
      await update(profileRef, {
        headline: headline.trim(),
        bio: bio.trim(),
      });
      setEditing(false);
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Não foi possível salvar seu perfil agora.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("./index"); // volta para login (app/index)
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Não foi possível sair. Tente novamente.");
    }
  };

  const handleChangePreferences = () => {
    // abre novamente o onboarding para o usuário ajustar área/tempo/nível
    router.push("/onboarding");
  };

  const nome = profile?.nome || "Explorador(a)";
  const email = profile?.email || auth.currentUser?.email || "sem e-mail";
  const initials = getInitials(nome);
  const areaLabel =
    (profile?.areaInteresse && AREA_LABELS[profile.areaInteresse]) ||
    "Não definido";
  const nivelLabel =
    (profile?.nivel && NIVEL_LABELS[profile.nivel]) || "Não informado";

  const tempoLabel = profile?.tempoDisponivel
    ? profile.tempoDisponivel === "3"
      ? "Até 3h por semana"
      : profile.tempoDisponivel === "5"
      ? "3 a 5h por semana"
      : "5 a 10h por semana"
    : "Ajuste nas preferências";

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          flex: 1,
          opacity: contentOpacity,
          transform: [{ translateY: contentTranslateY }],
        }}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* HEADER DO PERFIL */}
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>

            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.name}>{nome}</Text>
              <Text style={styles.email}>{email}</Text>
            </View>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
            >
              <Ionicons
                name="log-out-outline"
                size={16}
                color={COLORS.textLight}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.logoutText}>Sair</Text>
            </TouchableOpacity>
          </View>

          {/* PERFIL PÚBLICO / PERSONALIZAÇÃO */}
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View>
                <Text style={styles.cardTitle}>Perfil público</Text>
                <Text style={styles.cardSubtitle}>
                  Como você se apresenta para recrutadores, colegas e projetos.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.editPill}
                onPress={() => setEditing((prev) => !prev)}
              >
                <Ionicons
                  name={editing ? "close-outline" : "pencil-outline"}
                  size={14}
                  color={COLORS.textLight}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.editPillText}>
                  {editing ? "Cancelar" : "Editar"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Headline */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Headline</Text>
              {editing ? (
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Estudante de Tech focado em Dados & IA"
                  placeholderTextColor={COLORS.textMuted}
                  value={headline}
                  onChangeText={setHeadline}
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {headline || "Adicione uma frase sobre você."}
                </Text>
              )}
            </View>

            {/* Bio */}
            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Sobre você</Text>
              {editing ? (
                <TextInput
                  style={[styles.input, styles.inputMultiline]}
                  placeholder="Conte um pouco sobre seu momento, interesses e objetivos de carreira."
                  placeholderTextColor={COLORS.textMuted}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                />
              ) : (
                <Text style={styles.fieldValue}>
                  {bio ||
                    "Fale sobre sua trajetória, o que está estudando hoje e onde quer chegar."}
                </Text>
              )}
            </View>

            {editing && (
              <TouchableOpacity
                style={[styles.saveButton, saving && { opacity: 0.7 }]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? "Salvando..." : "Salvar perfil"}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* PREFERÊNCIAS DE CARREIRA */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Preferências de carreira</Text>
            <Text style={styles.cardSubtitle}>
              Essas informações ajudam a ÓRBITA a sugerir rotas e missões sob medida.
            </Text>

            <View style={styles.prefRow}>
              <View style={styles.prefItem}>
                <Text style={styles.prefLabel}>Área de interesse</Text>
                <Text style={styles.prefValue}>{areaLabel}</Text>
              </View>
              <View style={styles.prefItem}>
                <Text style={styles.prefLabel}>Nível atual</Text>
                <Text style={styles.prefValue}>{nivelLabel}</Text>
              </View>
            </View>

            <View style={[styles.prefItem, { marginTop: SIZES.sm }]}>
              <Text style={styles.prefLabel}>Tempo disponível</Text>
              <Text style={styles.prefValue}>{tempoLabel}</Text>
            </View>

            {/* BOTÃO ALTERAR PREFERÊNCIAS */}
            <TouchableOpacity
              style={styles.changePrefsButton}
              onPress={handleChangePreferences}
            >
              <Text style={styles.changePrefsButtonText}>
                Alterar preferências
              </Text>
            </TouchableOpacity>

            <Text style={styles.prefHint}>
              Ao alterar preferências, suas rotas em “Meu Futuro”, as missões
              e as respostas da IA serão ajustadas automaticamente.
            </Text>
          </View>

          {/* DICA EXTRA */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Como usar sua aba de perfil</Text>
            <Text style={styles.cardSubtitle}>
              Mantenha seu perfil atualizado: isso ajuda você a ter clareza sobre
              quem é hoje, para onde está indo e a comunicar isso em entrevistas,
              LinkedIn e portfólio.
            </Text>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingHorizontal: SIZES.lg,
    paddingTop: 64,
  },
  scroll: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SIZES.lg,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: COLORS.textLight,
    fontSize: 22,
    fontWeight: "bold",
  },
  name: {
    color: COLORS.textLight,
    fontSize: 20,
    fontWeight: "bold",
  },
  email: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#020617",
    marginLeft: 8,
  },
  logoutText: {
    color: COLORS.textLight,
    fontSize: 12,
  },
  card: {
    borderRadius: 20,
    padding: SIZES.md,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.45)",
    marginBottom: SIZES.lg,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SIZES.sm,
    gap: 8,
  },
  cardTitle: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: "600",
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  editPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#020617",
  },
  editPillText: {
    color: COLORS.textLight,
    fontSize: 12,
  },
  fieldBlock: {
    marginTop: SIZES.md,
  },
  fieldLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  fieldValue: {
    color: COLORS.textLight,
    fontSize: 14,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: COLORS.textLight,
    fontSize: 14,
    backgroundColor: "#020617",
  },
  inputMultiline: {
    minHeight: 70,
    textAlignVertical: "top",
  },
  saveButton: {
    marginTop: SIZES.md,
    borderRadius: 999,
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    alignItems: "center",
  },
  saveButtonText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: "600",
  },
  prefRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: SIZES.md,
  },
  prefItem: {
    flex: 1,
  },
  prefLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  prefValue: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: "500",
  },
  changePrefsButton: {
    marginTop: SIZES.lg,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: COLORS.primary, // azul do layout
  },
  changePrefsButtonText: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: "600",
  },
  prefHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SIZES.sm,
  },
});

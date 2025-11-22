import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Easing,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../../constants/theme";
import UICard from "../../components/UICard";
import { auth, db } from "../../services/firebase";
import { onValue, ref } from "firebase/database";

type Profile = {
  nome?: string;
  areaInteresse?: string;
  tempoDisponivel?: string;
  nivel?: string;
};

const AREA_LABELS: Record<string, string> = {
  dados: "Dados & Análise",
  ia: "Inteligência Artificial",
  cx: "Experiência do Cliente",
  verde: "Carreiras Verdes",
};

const NIVEL_LABELS: Record<string, string> = {
  iniciante: "Explorador iniciante",
  intermediario: "Explorador intermediário",
  avancado: "Explorador avançado",
};

// thresholds simples pra gamificar
const XP_LEVELS = [0, 200, 600, 1200, 2000];

type Route = {
  title: string;
  description: string;
  duration: string;
  focus: string;
};

function computeLevel(xp: number) {
  let level = 1;
  for (let i = 0; i < XP_LEVELS.length; i++) {
    if (xp >= XP_LEVELS[i]) {
      level = i + 1;
    }
  }

  const currentThreshold = XP_LEVELS[level - 1] ?? 0;
  const nextThreshold = XP_LEVELS[level] ?? XP_LEVELS[XP_LEVELS.length - 1];
  const maxed = level >= XP_LEVELS.length;

  const range = nextThreshold - currentThreshold || 1;
  const progress = maxed ? 1 : Math.min(1, (xp - currentThreshold) / range);
  const xpToNext = maxed ? 0 : Math.max(0, nextThreshold - xp);

  return { level, progress, xpToNext, maxed, nextThreshold };
}

function getRoutesForArea(area?: string | null): Route[] {
  switch (area) {
    case "dados":
      return [
        {
          title: "Fundamentos de Dados",
          description:
            "Lógica, Excel/Sheets e primeiros dashboards para análise.",
          duration: "4–6 semanas",
          focus: "Base sólida + portfólio inicial",
        },
        {
          title: "SQL & BI na prática",
          description:
            "SQL, modelagem simples e dashboards em Power BI / Data Studio.",
          duration: "6–8 semanas",
          focus: "Dashboards para decisões reais",
        },
        {
          title: "Automação de Rotinas",
          description:
            "Integração de dados e automações para times de negócio.",
          duration: "8+ semanas",
          focus: "Automatizar relatórios e processos",
        },
      ];
    case "ia":
      return [
        {
          title: "Fundamentos de IA Generativa",
          description:
            "Prompt engineering e casos de uso de IA no dia a dia.",
          duration: "3–5 semanas",
          focus: "Uso consciente de IA",
        },
        {
          title: "APIs & Agentes de IA",
          description:
            "Consumo de APIs (Gemini/ChatGPT), bots e agentes simples.",
          duration: "6–8 semanas",
          focus: "Protótipos de produtos com IA",
        },
        {
          title: "Especialização em IA",
          description:
            "Aprofundar em Produto, Dados ou Customer Experience com IA.",
          duration: "8+ semanas",
          focus: "Virar referência em uma vertical",
        },
      ];
    case "cx":
      return [
        {
          title: "Jornada do Cliente",
          description:
            "Mapeamento de jornada, pontos de contato e métricas de CX.",
          duration: "4–6 semanas",
          focus: "Entender dores do usuário",
        },
        {
          title: "Omnichannel & Automação",
          description:
            "Chatbots, automações e integrações entre canais digitais.",
          duration: "6–8 semanas",
          focus: "Escalar atendimento com qualidade",
        },
        {
          title: "Estratégia de CX",
          description:
            "Gestão de NPS, pesquisas e melhoria contínua com dados.",
          duration: "8+ semanas",
          focus: "CX como diferencial competitivo",
        },
      ];
    case "verde":
      return [
        {
          title: "Fundamentos de ESG",
          description:
            "Conceitos de ESG, sustentabilidade e indicadores ambientais.",
          duration: "3–5 semanas",
          focus: "Linguagem de sustentabilidade",
        },
        {
          title: "Projetos & Dados Verdes",
          description:
            "Medição de impacto e projetos de eficiência com dados.",
          duration: "6–8 semanas",
          focus: "Impacto real em projetos",
        },
        {
          title: "Tech for Good",
          description:
            "Uso de tecnologia e IA em iniciativas socioambientais.",
          duration: "8+ semanas",
          focus: "Carreira com propósito",
        },
      ];
    default:
      return [
        {
          title: "Fundamentos Digitais",
          description:
            "Lógica, pensamento analítico e ferramentas digitais base.",
          duration: "4–6 semanas",
          focus: "Base para qualquer área",
        },
        {
          title: "Portfólio & Networking",
          description:
            "Projetos práticos, LinkedIn, currículo e networking.",
          duration: "4–6 semanas",
          focus: "Abrir portas na área desejada",
        },
        {
          title: "Especialização",
          description:
            "Escolha uma área para se aprofundar com projetos guiados.",
          duration: "6–10 semanas",
          focus: "Ganhar profundidade",
        },
      ];
  }
}

// ícone diferente pra cada trilha
function getRouteIcon(index: number): keyof typeof Ionicons.glyphMap {
  switch (index) {
    case 0:
      return "analytics-outline"; // fundamentos
    case 1:
      return "code-slash-outline"; // parte mais técnica
    case 2:
      return "rocket-outline"; // especialização/avanço
    default:
      return "school-outline";
  }
}

// dica rápida extra para cada trilha
function getRouteHint(index: number): string {
  switch (index) {
    case 0:
      return "Ideal para consolidar sua base e criar o primeiro projeto de portfólio.";
    case 1:
      return "Foque em produzir 1 dashboard que responda a perguntas reais de negócio.";
    case 2:
      return "Use essa trilha para aprofundar em uma área e se posicionar melhor em vagas.";
    default:
      return "Transforme essa trilha em um projeto concreto para seu portfólio.";
  }
}

export default function FutureScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [selectedRouteTitle, setSelectedRouteTitle] = useState<string | null>(
    null
  );

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const profileRef = ref(db, `users/${user.uid}/profile`);
    const statsRef = ref(db, `users/${user.uid}/stats`);

    const unsubProfile = onValue(profileRef, (snapshot) => {
      const data = snapshot.val() as Profile | null;
      setProfile(data);
    });

    const unsubStats = onValue(statsRef, (snapshot) => {
      const data = snapshot.val() as { xpTotal?: number } | null;
      setTotalXp(data?.xpTotal || 0);
    });

    return () => {
      unsubProfile();
      unsubStats();
    };
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(contentTranslateY, {
        toValue: 0,
        duration: 500,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [contentOpacity, contentTranslateY]);

  const nome = profile?.nome || "Explorador(a)";
  const areaKey = profile?.areaInteresse || null;
  const areaLabel =
    (areaKey && AREA_LABELS[areaKey]) || "Carreira em destaque";

  const nivelLabel =
    (profile?.nivel && NIVEL_LABELS[profile.nivel]) || "Nível em construção";

  const { level, progress, xpToNext, maxed } = computeLevel(totalXp);
  const routes = getRoutesForArea(areaKey);

  const toggleRoute = (title: string) => {
    setSelectedRouteTitle((prev) => (prev === title ? null : title));
  };

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
          {/* Cabeçalho mais clean */}
          <View style={styles.header}>
            <Text style={styles.greeting}>Olá, {nome}</Text>
            <Text style={styles.subtitle}>
              Este é o resumo da sua jornada em{" "}
              <Text style={styles.highlight}>{areaLabel}</Text>.
            </Text>
          </View>

          {/* Card de XP mais simples */}
          <View style={styles.xpCard}>
            <View style={styles.xpHeaderRow}>
              <View>
                <Text style={styles.xpTitle}>Progresso geral</Text>
                <Text style={styles.xpSubtitle}>{nivelLabel}</Text>
              </View>
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeNumber}>{level}</Text>
                <Text style={styles.levelBadgeLabel}>nível</Text>
              </View>
            </View>

            <View style={styles.xpRow}>
              <Text style={styles.xpValue}>{totalXp} XP</Text>
              {!maxed && (
                <Text style={styles.xpToNext}>
                  +{xpToNext} XP para o próximo nível
                </Text>
              )}
            </View>

            <View style={styles.xpBarTrack}>
              <View
                style={[
                  styles.xpBarFill,
                  { width: `${Math.max(5, progress * 100)}%` },
                ]}
              />
            </View>
          </View>

          {/* Cards rápidos com poucas infos */}
          <View style={styles.quickRow}>
            <View style={styles.quickCard}>
              <Text style={styles.quickLabel}>Área foco</Text>
              <Text style={styles.quickValue}>{areaLabel}</Text>
            </View>

            <View style={styles.quickCard}>
              <Text style={styles.quickLabel}>Tempo / semana</Text>
              <Text style={styles.quickValue}>
                {profile?.tempoDisponivel
                  ? profile.tempoDisponivel === "3"
                    ? "Até 3h"
                    : profile.tempoDisponivel === "5"
                    ? "3 a 5h"
                    : "5 a 10h"
                  : "Ajuste no Perfil"}
              </Text>
            </View>
          </View>

          {/* Rotas sugeridas como botões de curso */}
          <Text style={styles.sectionTitle}>Próximas rotas</Text>
          <Text style={styles.sectionSubtitle}>
            Escolha uma trilha abaixo e veja como ela te ajuda a avançar.
          </Text>

          {routes.map((route, index) => {
            const isOpen = selectedRouteTitle === route.title;
            const iconName = getRouteIcon(index);
            const hint = getRouteHint(index);

            return (
              <View key={route.title} style={styles.routeCard}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  style={styles.routeButton}
                  onPress={() => toggleRoute(route.title)}
                >
                  <View style={styles.routeButtonLeft}>
                    <View style={styles.routeIconCircle}>
                      <Ionicons
                        name={iconName}
                        size={20}
                        color={COLORS.secondary}
                      />
                    </View>
                    <View>
                      <Text style={styles.routeButtonIndex}>
                        {index + 1 < 10 ? `0${index + 1}` : index + 1}
                      </Text>
                      <Text style={styles.routeButtonTitle}>
                        {route.title}
                      </Text>
                    </View>
                  </View>

                  <Ionicons
                    name={isOpen ? "chevron-up-outline" : "chevron-down-outline"}
                    size={20}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.routeDetail}>
                    <Text style={styles.routeDescription}>
                      {route.description}
                    </Text>

                    <View style={styles.routeMetaRow}>
                      <View style={styles.metaPill}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color={COLORS.textMuted}
                          style={{ marginRight: 6 }}
                        />
                        <Text style={styles.metaText}>{route.duration}</Text>
                      </View>
                      <View style={styles.metaPill}>
                        <Ionicons
                          name="school-outline"
                          size={14}
                          color={COLORS.textMuted}
                          style={{ marginRight: 4 }}
                        />
                        <Text style={styles.metaText}>{route.focus}</Text>
                      </View>
                    </View>

                    <Text style={styles.routeHint}>{hint}</Text>
                  </View>
                )}
              </View>
            );
          })}

          {/* Dica bem curtinha */}
          <UICard
            title="Dica rápida"
            description="Use a aba Missões para transformar essas rotas em passos pequenos e diários."
          />
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
  header: {
    marginBottom: SIZES.lg,
  },
  greeting: {
    color: COLORS.textLight,
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  highlight: {
    color: COLORS.secondary,
    fontWeight: "600",
  },
  xpCard: {
    padding: SIZES.md,
    borderRadius: 18,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.45)",
    marginBottom: SIZES.lg,
  },
  xpHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SIZES.sm,
  },
  xpTitle: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: "600",
  },
  xpSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  levelBadge: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
  },
  levelBadgeNumber: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: "bold",
  },
  levelBadgeLabel: {
    color: COLORS.textLight,
    fontSize: 10,
    textTransform: "uppercase",
  },
  xpRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  xpValue: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: "700",
  },
  xpToNext: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "right",
  },
  xpBarTrack: {
    height: 6,
    borderRadius: 999,
    backgroundColor: "#0f172a",
    overflow: "hidden",
  },
  xpBarFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.secondary,
  },
  quickRow: {
    flexDirection: "row",
    gap: 14,
    marginBottom: SIZES.lg,
  },
  quickCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.35)",
  },
  quickLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  quickValue: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: "600",
  },
  sectionTitle: {
    color: COLORS.textLight,
    fontSize: 20,
    fontWeight: "600",
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: SIZES.md,
  },
  routeCard: {
    borderRadius: 16,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.3)",
    marginBottom: SIZES.md,
    overflow: "hidden",
  },
  routeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: SIZES.md,
    paddingVertical: 22, // botão mais alto
  },
  routeButtonLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  routeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0b1120",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  routeButtonIndex: {
    color: COLORS.secondary,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  routeButtonTitle: {
    color: COLORS.textLight,
    fontSize: 15,
    fontWeight: "600",
  },
  routeDetail: {
    paddingHorizontal: SIZES.md,
    paddingBottom: SIZES.md,
  },
  routeDescription: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },
  routeMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  routeHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
});

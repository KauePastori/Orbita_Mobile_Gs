import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../../constants/theme";
import UICard from "../../components/UICard";
import { auth, db } from "../../services/firebase";
import { onValue, ref, set, update } from "firebase/database";

type Mission = {
  id: string;
  title: string;
  description: string;
  xp: number;
  category: "hoje" | "semana";
};

const MISSIONS: Mission[] = [
  {
    id: "m1",
    title: "Estudar fundamentos de dados (30 min)",
    description:
      "Assista 1 aula sobre tipos de dados e anote 3 insights importantes.",
    xp: 50,
    category: "hoje",
  },
  {
    id: "m2",
    title: "Prática guiada (45 min)",
    description:
      "Reproduza um dashboard simples em qualquer ferramenta que você conhecer.",
    xp: 70,
    category: "hoje",
  },
  {
    id: "m3",
    title: "Refletir sobre sua carreira",
    description:
      "Escreva em 5 linhas onde você quer estar em 2 anos profissionalmente.",
    xp: 40,
    category: "semana",
  },
  {
    id: "m4",
    title: "Cuidar de você",
    description:
      "Reserve 20 minutos para descanso, alongamento ou meditação.",
    xp: 30,
    category: "semana",
  },
];

type MissionsProgress = {
  [missionId: string]: {
    completed: boolean;
    completedAt: string;
    xp: number;
  };
};

export default function MissionsScreen() {
  const [progress, setProgress] = useState<MissionsProgress>({});
  const [totalXp, setTotalXp] = useState(0);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const missionsRef = ref(db, `users/${user.uid}/missions`);
    const statsRef = ref(db, `users/${user.uid}/stats`);

    const unsubMissions = onValue(missionsRef, (snapshot) => {
      const data = (snapshot.val() || {}) as MissionsProgress;
      setProgress(data);
    });

    const unsubStats = onValue(statsRef, (snapshot) => {
      const data = snapshot.val() as { xpTotal?: number } | null;
      setTotalXp(data?.xpTotal || 0);
    });

    return () => {
      unsubMissions();
      unsubStats();
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

  const missionsHoje = useMemo(
    () => MISSIONS.filter((m) => m.category === "hoje"),
    []
  );
  const missionsSemana = useMemo(
    () => MISSIONS.filter((m) => m.category === "semana"),
    []
  );

  // Cálculos de XP e progresso
  const {
    xpHojeConcluido,
    xpHojeTotal,
    xpSemanaConcluido,
    xpSemanaTotal,
    concluidasHoje,
    concluidasSemana,
    concluidasTotal,
  } = useMemo(() => {
    let xpHojeC = 0;
    let xpHojeT = 0;
    let xpSemC = 0;
    let xpSemT = 0;
    let cHoje = 0;
    let cSem = 0;

    missionsHoje.forEach((m) => {
      xpHojeT += m.xp;
      if (progress[m.id]?.completed) {
        xpHojeC += m.xp;
        cHoje += 1;
      }
    });

    missionsSemana.forEach((m) => {
      xpSemT += m.xp;
      if (progress[m.id]?.completed) {
        xpSemC += m.xp;
        cSem += 1;
      }
    });

    const totalConcluidas = Object.values(progress).filter(
      (p) => p.completed
    ).length;

    return {
      xpHojeConcluido: xpHojeC,
      xpHojeTotal: xpHojeT,
      xpSemanaConcluido: xpSemC,
      xpSemanaTotal: xpSemT,
      concluidasHoje: cHoje,
      concluidasSemana: cSem,
      concluidasTotal: totalConcluidas,
    };
  }, [progress, missionsHoje, missionsSemana]);

  const handleCompleteMission = async (mission: Mission) => {
    const user = auth.currentUser;
    if (!user) return;

    if (progress[mission.id]?.completed) return;

    const missionRef = ref(db, `users/${user.uid}/missions/${mission.id}`);
    const statsRef = ref(db, `users/${user.uid}/stats`);

    const newTotalXp = totalXp + mission.xp;

    await set(missionRef, {
      completed: true,
      completedAt: new Date().toISOString(),
      xp: mission.xp,
    });

    await update(statsRef, {
      xpTotal: newTotalXp,
      lastUpdated: new Date().toISOString(),
    });

    setTotalXp(newTotalXp);
  };

  const renderMission = (mission: Mission, index: number) => {
    const isCompleted = progress[mission.id]?.completed;

    return (
      <TouchableOpacity
        key={mission.id}
        activeOpacity={0.9}
        onPress={() => handleCompleteMission(mission)}
      >
        <View
          style={[
            styles.missionCard,
            isCompleted && styles.missionCardCompleted,
          ]}
        >
          <View style={styles.missionIconWrapper}>
            <View style={styles.missionIconCircle}>
              <Ionicons
                name={isCompleted ? "checkmark-done" : "flash-outline"}
                size={18}
                color={isCompleted ? COLORS.textLight : COLORS.secondary}
              />
            </View>
            <Text style={styles.missionIndex}>
              {index + 1 < 10 ? `0${index + 1}` : index + 1}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.missionTitle}>{mission.title}</Text>
            <Text style={styles.missionDescription}>
              {mission.description}
            </Text>

            <View style={styles.missionMetaRow}>
              <View style={styles.missionChip}>
                <Ionicons
                  name="trophy-outline"
                  size={14}
                  color={COLORS.secondary}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.missionXp}>{mission.xp} XP</Text>
              </View>

              {isCompleted && (
                <View style={styles.missionChipCompleted}>
                  <Ionicons
                    name="checkmark-circle"
                    size={14}
                    color="#bbf7d0"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.missionChipCompletedText}>
                    Concluída
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const pctHoje =
    xpHojeTotal > 0 ? Math.min(1, xpHojeConcluido / xpHojeTotal) : 0;
  const pctSemana =
    xpSemanaTotal > 0 ? Math.min(1, xpSemanaConcluido / xpSemanaTotal) : 0;

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
          {/* Cabeçalho */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Missões</Text>
              <Text style={styles.subtitle}>
                Complete missões para ganhar XP e avançar na sua jornada.
              </Text>
            </View>

            <View style={styles.seasonPill}>
              <Ionicons
                name="flame-outline"
                size={14}
                color={COLORS.secondary}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.seasonText}>Temporada 1</Text>
            </View>
          </View>

          {/* Resumo de XP com “gráfico” */}
          <View style={styles.xpGrid}>
            <View style={styles.xpCard}>
              <Text style={styles.xpLabel}>XP total</Text>
              <Text style={styles.xpValue}>{totalXp} XP</Text>
              <Text style={styles.xpHint}>
                A soma de todas as missões concluídas.
              </Text>
            </View>

            <View style={styles.xpCard}>
              <Text style={styles.xpLabel}>Missões concluídas</Text>
              <Text style={styles.xpValue}>{concluidasTotal}</Text>
              <Text style={styles.xpHint}>
                Continue a sequência para crescer mais rápido.
              </Text>
            </View>
          </View>

          {/* Dashboard diário/semanal */}
          <View style={styles.dashboardCard}>
            <Text style={styles.dashboardTitle}>Progresso recente</Text>
            <Text style={styles.dashboardSubtitle}>
              Veja como está seu XP hoje e nesta semana.
            </Text>

            {/* Hoje */}
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.progressLabel}>Hoje</Text>
                <Text style={styles.progressValue}>
                  {xpHojeConcluido}/{xpHojeTotal || 0} XP
                </Text>
              </View>
              <Text style={styles.progressPercent}>
                {Math.round(pctHoje * 100)}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.max(6, pctHoje * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressHint}>
              {concluidasHoje} de {missionsHoje.length} missões de hoje concluídas.
            </Text>

            {/* Semana */}
            <View style={[styles.rowBetween, { marginTop: SIZES.md }]}>
              <View>
                <Text style={styles.progressLabel}>Semana</Text>
                <Text style={styles.progressValue}>
                  {xpSemanaConcluido}/{xpSemanaTotal || 0} XP
                </Text>
              </View>
              <Text style={styles.progressPercent}>
                {Math.round(pctSemana * 100)}%
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFillSecondary,
                  { width: `${Math.max(6, pctSemana * 100)}%` },
                ]}
              />
            </View>
            <Text style={styles.progressHint}>
              {concluidasSemana} de {missionsSemana.length} missões semanais concluídas.
            </Text>
          </View>

          {/* Missões de hoje */}
          <Text style={styles.sectionTitle}>Missões de hoje</Text>
          <Text style={styles.sectionSubtitle}>
            Foque nessas missões para garantir seu XP diário.
          </Text>
          {missionsHoje.map((m, idx) => renderMission(m, idx))}

          {/* Missões da semana */}
          <Text style={[styles.sectionTitle, { marginTop: SIZES.lg }]}>
            Missões da semana
          </Text>
          <Text style={styles.sectionSubtitle}>
            Atividades mais longas para consolidar seus aprendizados.
          </Text>
          {missionsSemana.map((m, idx) => renderMission(m, idx))}

          {/* Dica extra */}
          <UICard
            title="Como a ÓRBITA usa suas missões"
            description="Seu XP alimenta a tela Meu Futuro e ajuda a IA ÓRBITA a entender seu ritmo, sugerindo rotas de carreira e desafios no nível certo para você."
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
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SIZES.lg,
    gap: 12,
  },
  title: {
    color: COLORS.textLight,
    fontSize: 26,
    fontWeight: "bold",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  seasonPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#020617",
    marginTop: 4,
  },
  seasonText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  xpGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: SIZES.lg,
  },
  xpCard: {
    flex: 1,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.4)",
  },
  xpLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  xpValue: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 4,
  },
  xpHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  dashboardCard: {
    borderRadius: 20,
    padding: SIZES.md,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.45)",
    marginBottom: SIZES.lg,
  },
  dashboardTitle: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: "600",
  },
  dashboardSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: SIZES.md,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  progressLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  progressValue: {
    color: COLORS.textLight,
    fontSize: 14,
    marginTop: 2,
  },
  progressPercent: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: "700",
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "#0f172a",
    marginTop: 6,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.secondary,
  },
  progressFillSecondary: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: COLORS.primary,
  },
  progressHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginBottom: SIZES.sm,
  },
  missionCard: {
    backgroundColor: "#020617",
    borderRadius: 18,
    padding: SIZES.md,
    marginBottom: SIZES.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  missionCardCompleted: {
    borderColor: COLORS.primary,
    backgroundColor: "#022c22",
  },
  missionIconWrapper: {
    alignItems: "center",
  },
  missionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
    backgroundColor: "#020617",
  },
  missionIndex: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  missionTitle: {
    color: COLORS.textLight,
    fontSize: 15,
    fontWeight: "600",
  },
  missionDescription: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  missionMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
  },
  missionChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  missionXp: {
    color: COLORS.secondary,
    fontSize: 12,
  },
  missionChipCompleted: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#166534",
  },
  missionChipCompletedText: {
    color: "#bbf7d0",
    fontSize: 12,
    fontWeight: "600",
  },
});

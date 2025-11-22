import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Svg, Circle, G } from "react-native-svg";
import { COLORS, SIZES } from "../../constants/theme";

type MetricEntry = {
  userId: string;
  temperature: number;
  humidity: number;
  light: number;
  noise: number;
  score: number;
  working: boolean;
  workMinutes: number;
  timestamp: number;
};

// ⚠️ Ajuste esse endereço para o ambiente que você estiver usando
const API_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:3000" // emulador Android
    : "http://192.168.0.79:3000/api/metrics"; // iOS simulador / web
// Se estiver testando no celular físico, troque por algo como:
// const API_BASE = "http://192.168.0.10:3000";

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

type DonutProps = {
  percent: number; // 0–100
  label: string;
  valueText: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
};

function DonutChart({
  percent,
  label,
  valueText,
  size = 120,
  strokeWidth = 10,
  color = COLORS.secondary,
}: DonutProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = clamp(percent);
  const strokeDashoffset =
    circumference - (circumference * clamped) / 100 || 0;

  return (
    <View style={{ width: size, alignItems: "center", marginBottom: 16 }}>
      <Svg width={size} height={size}>
        <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
          {/* trilho */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#0f172a"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
          />
          {/* preenchimento */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            fill="transparent"
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
          />
        </G>
      </Svg>

      <View style={styles.donutCenter}>
        <Text style={styles.donutValue}>{valueText}</Text>
        <Text style={styles.donutPercent}>{Math.round(clamped)}%</Text>
      </View>

      <Text style={styles.donutLabel}>{label}</Text>
    </View>
  );
}

export default function OrbitaScreen() {
  const [latest, setLatest] = useState<MetricEntry | null>(null);
  const [loading, setLoading] = useState(true);

  // polling simples a cada 5s
  useEffect(() => {
    let isMounted = true;

    const fetchMetrics = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/metrics`);
        const data: MetricEntry[] = await res.json();

        if (!isMounted) return;
        if (Array.isArray(data) && data.length > 0) {
          const last = data[data.length - 1];
          setLatest(last);
        }
      } catch (err) {
        console.log("Erro ao buscar métricas:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // métricas derivadas para os donuts
  const scorePercent = clamp(latest?.score ?? 0);
  const focusPercent = clamp(((latest?.workMinutes ?? 0) / 60) * 100); // 60 min = 100%
  const workingPercent = latest?.working ? 100 : 0;

  const lastUpdate =
    latest &&
    new Date(latest.timestamp || Date.now()).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  return (
    <View style={styles.container}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>Órbita em tempo real</Text>
           
          </View>

          <View style={styles.badge}>
            <Ionicons
              name="hardware-chip-outline"
              size={18}
              color={COLORS.secondary}
            />
            <Text style={styles.badgeText}>
              {latest ? "Sinal ativo" : "Aguardando dados"}
            </Text>
          </View>
        </View>

        {!latest && loading && (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={COLORS.secondary} />
            <Text style={styles.loadingText}>Conectando à ÓRBITA Desk…</Text>
          </View>
        )}

        {latest && (
          <>
            {/* Donuts principais */}
            <View style={styles.donutRow}>
              <DonutChart
                percent={scorePercent}
                label="Score de bem-estar"
                valueText={`${Math.round(scorePercent)}%`}
                color={COLORS.secondary}
              />
              <DonutChart
                percent={focusPercent}
                label="Tempo focado hoje"
                valueText={`${latest.workMinutes} min`}
                color={COLORS.primary}
              />
              <DonutChart
                percent={workingPercent}
                label="Status agora"
                valueText={latest.working ? "Trabalhando" : "Pausa"}
                color={latest.working ? COLORS.primary : "#64748b"}
              />
            </View>

            {/* Cards com leituras brutas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Ambiente de trabalho</Text>
              <Text style={styles.sectionSubtitle}>
                Dados do seu ambiente de trabalho com monitoramento em tempo real 
                para a melhora do seu bem-estar.
              </Text>

              <View style={styles.metricsGrid}>
                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Ionicons
                      name="thermometer-outline"
                      size={18}
                      color={COLORS.secondary}
                    />
                    <Text style={styles.metricTitle}>Temperatura</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {latest.temperature.toFixed(1)} °C
                  </Text>
                  <Text style={styles.metricHint}>
                    Ideal manter entre 21 °C e 26 °C para conforto.
                  </Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Ionicons
                      name="water-outline"
                      size={18}
                      color={COLORS.secondary}
                    />
                    <Text style={styles.metricTitle}>Umidade</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {latest.humidity.toFixed(0)} %
                  </Text>
                  <Text style={styles.metricHint}>
                    Umidade equilibrada evita desconforto e fadiga.
                  </Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Ionicons
                      name="sunny-outline"
                      size={18}
                      color={COLORS.secondary}
                    />
                    <Text style={styles.metricTitle}>Luz ambiente</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {latest.light.toFixed(0)} lux
                  </Text>
                  <Text style={styles.metricHint}>
                    Iluminação adequada melhora foco e energia.
                  </Text>
                </View>

                <View style={styles.metricCard}>
                  <View style={styles.metricHeader}>
                    <Ionicons
                      name="volume-high-outline"
                      size={18}
                      color={COLORS.secondary}
                    />
                    <Text style={styles.metricTitle}>Ruído</Text>
                  </View>
                  <Text style={styles.metricValue}>
                    {latest.noise.toFixed(0)} dB
                  </Text>
                  <Text style={styles.metricHint}>
                    Ambientes mais silenciosos favorecem concentração.
                  </Text>
                </View>
              </View>
            </View>

            {/* Rodapé com última leitura */}
            {lastUpdate && (
              <Text style={styles.footerInfo}>
                Última leitura recebida às {lastUpdate}
              </Text>
            )}
          </>
        )}

        {!latest && !loading && (
          <View style={styles.emptyBox}>
            <Ionicons
              name="cloud-offline-outline"
              size={26}
              color={COLORS.textMuted}
            />
            <Text style={styles.emptyTitle}>Nenhum dado recebido ainda</Text>
            <Text style={styles.emptyText}>
              Certifique-se que o ESP32 está enviando POST para{" "}
              <Text style={{ fontWeight: "600" }}>
                {API_BASE}/api/metrics
              </Text>{" "}
              e que o app está na mesma rede.
            </Text>
          </View>
        )}
      </ScrollView>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: SIZES.lg,
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
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#020617",
  },
  badgeText: {
    color: COLORS.secondary,
    fontSize: 12,
    marginLeft: 6,
  },
  loadingBox: {
    marginTop: SIZES.lg,
    alignItems: "center",
    gap: 8,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  donutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SIZES.lg,
  },
  donutCenter: {
    position: "absolute",
    top: "35%",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  donutValue: {
    color: COLORS.textLight,
    fontSize: 14,
    fontWeight: "600",
  },
  donutPercent: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  donutLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 6,
    textAlign: "center",
  },
  section: {
    marginBottom: SIZES.lg,
  },
  sectionTitle: {
    color: COLORS.textLight,
    fontSize: 18,
    fontWeight: "600",
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
    marginBottom: SIZES.md,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    flexBasis: "48%",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.40)",
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  metricTitle: {
    color: COLORS.textLight,
    fontSize: 13,
    fontWeight: "600",
  },
  metricValue: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: "700",
    marginTop: 2,
  },
  metricHint: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  footerInfo: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginTop: SIZES.sm,
    textAlign: "center",
  },
  emptyBox: {
    marginTop: SIZES.lg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SIZES.lg,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: COLORS.textLight,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
    textAlign: "center",
  },
});

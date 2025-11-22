import { router } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useEffect, useRef, useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { COLORS, SIZES } from "../constants/theme";
import UIInput from "../components/UIInput";
import UIButton from "../components/UIButton";
import { auth } from "../services/firebase";

const BG_IMAGE = require("../assets/images/orbita-bg.jpg");

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, {
        toValue: 1,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(cardTranslateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardOpacity, cardTranslateY]);

  const handleLogin = async () => {
    if (!email || !senha) {
      setErrorMsg("Preencha e-mail e senha para continuar.");
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      await signInWithEmailAndPassword(auth, email.trim(), senha);
      router.replace("/onboarding");
    } catch (error: any) {
      console.log(error);

      let msg = "Verifique seus dados e tente novamente.";
      if (error.code === "auth/invalid-credential") {
        msg = "E-mail ou senha inválidos.";
      } else if (error.code === "auth/user-not-found") {
        msg = "Usuário não encontrado. Crie uma conta.";
      }

      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ImageBackground
      source={BG_IMAGE}
      style={styles.bg}
      resizeMode="cover"
    >
      {/* overlay com leve gradiente pra dar cara de app premium */}
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.centerWrapper}>
          <Animated.View
            style={[
              styles.card,
              { opacity: cardOpacity, transform: [{ translateY: cardTranslateY }] },
            ]}
          >
            <View style={styles.logoCircle}>
              <Ionicons name="planet-outline" size={26} color={COLORS.textLight} />
            </View>

            <Text style={styles.brand}>ÓRBITA • Career API</Text>

            <Text style={styles.title}>Bem-vindo de volta</Text>
            <Text style={styles.subtitle}>
              Acompanhe sua jornada profissional
            </Text>

            <View style={styles.formArea}>
              <UIInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                icon="mail-outline"
              />

              <UIInput
                placeholder="Senha"
                secureTextEntry
                value={senha}
                onChangeText={setSenha}
                icon="lock-closed-outline"
                isPassword
              />

              {errorMsg && (
                <View style={styles.errorBox}>
                  <Ionicons
                    name="alert-circle-outline"
                    size={18}
                    color="#fecaca"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              )}

              <UIButton
                title={loading ? "Entrando..." : "Entrar na ÓRBITA"}
                onPress={handleLogin}
              />
            </View>

            <TouchableOpacity
              onPress={() => router.replace("/register")}
              style={{ marginTop: SIZES.md }}
            >
              <Text style={styles.footerText}>
                Ainda não tem conta?{" "}
                <Text style={styles.footerHighlight}>Criar conta</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Em breve",
                  "A recuperação de senha será adicionada futuramente."
                )
              }
              style={{ marginTop: 4 }}
            >
              <Text style={styles.linkText}>Esqueci minha senha</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bg: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(3, 7, 18, 0.75)",
  },
  flex: {
    flex: 1,
  },
  centerWrapper: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SIZES.lg,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 24,
    paddingVertical: SIZES.xl,
    paddingHorizontal: SIZES.lg,
    backgroundColor: "rgba(15, 23, 42, 0.9)", // efeito glass escuro
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.35)",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 16,
    alignItems: "center",
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: SIZES.sm,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
  },
  brand: {
    color: COLORS.textMuted,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: SIZES.sm,
  },
  title: {
    color: COLORS.textLight,
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.textMuted,
    marginTop: 4,
    fontSize: 14,
    textAlign: "center",
  },
  formArea: {
    width: "100%",
    marginTop: SIZES.lg,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7f1d1dcc",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
    marginBottom: 4,
  },
  errorText: {
    color: "#fee2e2",
    fontSize: 13,
    flex: 1,
  },
  footerText: {
    color: COLORS.textMuted,
    textAlign: "center",
    fontSize: 14,
  },
  footerHighlight: {
    color: COLORS.secondary,
    fontWeight: "600",
  },
  linkText: {
    color: COLORS.secondary,
    textAlign: "center",
    fontSize: 13,
  },
});

import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SIZES } from "../../constants/theme";
import { askOrbitaAI } from "../../services/ia";
import { auth } from "../../services/firebase";

type Message = {
  from: "user" | "ia";
  text: string;
};

const QUICK_PROMPTS = [
  "Quais próximos passos na minha carreira?",
  "Como montar um plano de estudos para os próximos 3 meses?",
  "Que tipo de projetos posso fazer para o meu portfólio?",
];

export default function AIScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "ia",
      text: "Olá, eu sou a ÓRBITA. Me conta onde você está hoje e para onde quer ir na sua carreira. 🚀",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentTranslateY = useRef(new Animated.Value(10)).current;
  const scrollRef = useRef<ScrollView | null>(null);

  // Pega o nome do usuário logado (displayName do Firebase Auth)
  useEffect(() => {
    const user = auth.currentUser;
    if (user?.displayName) {
      setUserName(user.displayName);
    }
  }, []);

  // Animação de entrada da tela
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

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollToEnd({ animated: true });
    }
  };

  const handleSend = async (textOverride?: string) => {
    const rawText = textOverride ?? input;
    if (!rawText.trim() || loading) return;

    const cleanText = rawText.trim();

    const userMessage: Message = { from: "user", text: cleanText };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setTimeout(scrollToBottom, 50);

    try {
      const answer = await askOrbitaAI(cleanText, userName || undefined);
      const iaMessage: Message = { from: "ia", text: answer };
      setMessages((prev) => [...prev, iaMessage]);
      setTimeout(scrollToBottom, 50);
    } catch {
      const errorMsg: Message = {
        from: "ia",
        text: "Tive um problema para falar com o servidor de IA agora. Tente novamente em alguns instantes. 🙏",
      };
      setMessages((prev) => [...prev, errorMsg]);
      setTimeout(scrollToBottom, 50);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    // se quiser já enviar direto, descomenta:
    // handleSend(prompt);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Animated.View
        style={[
          styles.inner,
          { opacity: contentOpacity, transform: [{ translateY: contentTranslateY }] },
        ]}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Ionicons name="planet-outline" size={20} color={COLORS.textLight} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>IA ÓRBITA</Text>
              
              {userName && (
                <Text style={styles.subtitleHighlight}>
                  Personalizada para você, {userName}.
                </Text>
              )}
            </View>
          </View>

          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Online</Text>
          </View>
        </View>

        {/* CHAT */}
        <ScrollView
          ref={scrollRef}
          style={styles.chat}
          contentContainerStyle={{ paddingBottom: 96 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        >
          {messages.map((msg, index) => {
            const isUser = msg.from === "user";
            return (
              <View
                key={index}
                style={[
                  styles.bubbleRow,
                  isUser ? styles.bubbleRowUser : styles.bubbleRowIA,
                ]}
              >
                {!isUser && (
                  <View style={styles.bubbleAvatarIa}>
                    <Ionicons
                      name="planet-outline"
                      size={16}
                      color={COLORS.textLight}
                    />
                  </View>
                )}

                <View
                  style={[
                    styles.bubble,
                    isUser ? styles.bubbleUser : styles.bubbleIA,
                  ]}
                >
                  <Text
                    style={[
                      styles.bubbleText,
                      isUser ? styles.bubbleTextUser : styles.bubbleTextIA,
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              </View>
            );
          })}

          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={COLORS.secondary} />
              <Text style={styles.loadingText}>ÓRBITA está pensando...</Text>
            </View>
          )}
        </ScrollView>

        {/* ÁREA INFERIOR: sugestões + input */}
        <View style={styles.bottomArea}>
          {/* Sugestões rápidas */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickRow}
          >
            {QUICK_PROMPTS.map((prompt) => (
              <TouchableOpacity
                key={prompt}
                style={styles.quickChip}
                onPress={() => handleQuickPrompt(prompt)}
              >
                <Ionicons
                  name="sparkles-outline"
                  size={14}
                  color={COLORS.secondary}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.quickChipText}>{prompt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input + botão enviar */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Pergunte algo sobre sua carreira, estudos ou próximos passos..."
              placeholderTextColor={COLORS.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || loading) && { opacity: 0.5 },
              ]}
              onPress={() => handleSend()}
              disabled={loading || !input.trim()}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.textLight} size="small" />
              ) : (
                <Ionicons name="send" size={18} color={COLORS.textLight} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
  },
  header: {
    paddingHorizontal: SIZES.lg,
    paddingTop: 64,
    paddingBottom: SIZES.sm,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: COLORS.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: COLORS.textLight,
    fontSize: 22,
    fontWeight: "bold",
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  subtitleHighlight: {
    color: COLORS.secondary,
    fontSize: 13,
    marginTop: 4,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#020617",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    marginRight: 6,
  },
  statusText: {
    color: COLORS.textMuted,
    fontSize: 11,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  chat: {
    flex: 1,
    paddingHorizontal: SIZES.lg,
    marginTop: SIZES.sm,
  },
  bubbleRow: {
    marginBottom: SIZES.sm,
    flexDirection: "row",
    maxWidth: "100%",
  },
  bubbleRowUser: {
    justifyContent: "flex-end",
  },
  bubbleRowIA: {
    justifyContent: "flex-start",
  },
  bubbleAvatarIa: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 6,
    marginTop: 2,
  },
  bubble: {
    maxWidth: "80%",
    borderRadius: 18,
    paddingHorizontal: SIZES.sm,
    paddingVertical: SIZES.sm,
  },
  bubbleUser: {
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  bubbleIA: {
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 15,
  },
  bubbleTextUser: {
    color: COLORS.textLight,
  },
  bubbleTextIA: {
    color: COLORS.textLight,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: SIZES.sm,
  },
  loadingText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  bottomArea: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    backgroundColor: "#020617",
    paddingHorizontal: SIZES.lg,
    paddingBottom: Platform.OS === "ios" ? 16 : 12,
    paddingTop: 8,
  },
  quickRow: {
    marginBottom: 8,
  },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#020617",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  quickChipText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    color: COLORS.textLight,
    paddingHorizontal: 0,
    paddingVertical: 6,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    color: COLORS.textLight,
    fontWeight: "600",
  },
});

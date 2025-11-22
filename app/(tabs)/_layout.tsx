import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../../constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#020617",
          borderTopColor: "#1F2937",
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Meu Futuro",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="hardware-chip-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="missions"
        options={{
          title: "Missões",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 🔵 NOVA ABA ÓRBITA */}
      <Tabs.Screen
        name="orbita"
        options={{
          title: "Órbita",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="planet-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="ai"
        options={{
          title: "IA ÓRBITA",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

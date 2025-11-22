import { Stack } from "expo-router";

export default function RootLayout() {
  return (
    <Stack>
      {/* Tela inicial: Login */}
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />

      {/* Onboarding (perguntas de perfil) */}
      <Stack.Screen
        name="onboarding"
        options={{
          title: "Seu Futuro",
          headerShown: false,
        }}
      />

      {/* Grupo de abas (app/(tabs)/...) */}
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />

      {/* Modal padrão do template (pode deixar) */}
      <Stack.Screen
        name="register"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}

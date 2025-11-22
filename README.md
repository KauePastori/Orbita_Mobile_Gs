# 🚀 ÓRBITA Mobile — Laboratório de Carreiras do Futuro

Aplicativo mobile oficial do ecossistema **ÓRBITA**, desenvolvido em **React Native + Expo** como parte da **Global Solution – Mobile Development / Engenharia de Software (FIAP)**.

A proposta é criar um **laboratório de carreiras do futuro**, onde o usuário:

- Descobre **rotas de carreira** alinhadas ao seu perfil  
- Completa **missões gamificadas** e ganha **XP**  
- Acompanha sua evolução em um dashboard chamado **“Meu Futuro”**  
- Conversa com uma **IA de Carreira (Gemini)**  
- Visualiza **indicadores de bem-estar e foco** vindos de um **ESP32 DevKit V1** em tempo quase real  
- Personaliza seu **perfil** e preferências a qualquer momento  

Tudo isso em uma interface **premium, escura, moderna e animada**, pensada para ser um app de portfólio profissional.

---

## 🧩 Visão Geral das Funcionalidades

### 🔐 Autenticação (Login & Registro)

- Login e registro utilizando **Firebase Authentication (Email/Password)**
- Telas de **Login** e **Registro** com:
  - Fundo com imagem temática da ÓRBITA
  - Cartão glassmorphism
  - Animações de entrada (fade + translate)
  - Campo de senha com **mostrar/ocultar**
  - Tratamento de erros de autenticação (credenciais inválidas, e-mail em uso, etc.)
- Após login/registro, o usuário é levado ao fluxo de **Onboarding**

---

### 🧭 Onboarding Inteligente

Tela: `app/onboarding.tsx`

No onboarding, o usuário responde **3 perguntas rápidas**:

1. **Área de interesse principal**  
   - Dados & Análise  
   - Inteligência Artificial  
   - Experiência do Cliente  
   - Carreiras Verdes

2. **Tempo disponível por semana**  
   - Até 3h / semana  
   - 3 a 5h / semana  
   - 5 a 10h / semana  

3. **Nível atual**  
   - Iniciante  
   - Intermediário  
   - Avançado  

Essas informações são salvas no **Firebase Realtime Database**, em:

```text
users/{uid}/profile
  - nome
  - email
  - areaInteresse
  - tempoDisponivel
  - nivel
  - updatedAt
```

> Essas preferências influenciam diretamente as telas **Meu Futuro**, **Missões** e **IA ÓRBITA**.

Após concluir o onboarding, o usuário é redirecionado para o grupo de abas `/(tabs)`.

---

### 🪐 Navegação Principal (Tabs)

Implementada com **Expo Router** em `app/(tabs)/_layout.tsx`:

- **Meu Futuro** → `app/(tabs)/index.tsx`  
- **Missões** → `app/(tabs)/missions.tsx`  
- **Órbita** (IoT / ESP32) → `app/(tabs)/orbita.tsx`  
- **IA ÓRBITA** → `app/(tabs)/ai.tsx`  
- **Perfil** → `app/(tabs)/explore.tsx`  

Cada aba possui ícones do **Ionicons** e estilo de barra inferior customizado:

```tsx
tabBarStyle: {
  backgroundColor: "#020617",
  borderTopColor: "#1F2937",
},
tabBarActiveTintColor: COLORS.primary,
tabBarInactiveTintColor: COLORS.textMuted,
```

---

## 📊 Meu Futuro – XP, Níveis e Rotas de Carreira

Tela: `app/(tabs)/index.tsx`

Funções principais:

- Exibir **saudação personalizada**: “Olá, {nome}”
- Mostrar **área foco** baseada no onboarding
- Calcular nível do usuário a partir do **XP total** salvo em `users/{uid}/stats`:
  - `xpTotal`
  - thresholds simples definidos no código (`XP_LEVELS`)
- Renderizar:
  - Card de **progresso geral** (nível + barra de XP)
  - Cards rápidos com **Área foco** e **Tempo / semana**
  - Seção **“Próximas rotas”**, adaptada à área de interesse:
    - Ex.: Dados, IA, CX, Verde ou trilha base
  - Cada rota é exibida como **botão/card clicável**, com:
    - Ícone (ex.: `school-outline`, `sparkles-outline`, `target-outline` etc.)
    - Título do curso/trilha
    - Ao clicar, abre **mais detalhes** sobre duração, foco e objetivo

> A lógica de geração de rotas está centralizada em `getRoutesForArea(area)`.

---

## 🎯 Missões – Gamificação com XP

Tela: `app/(tabs)/missions.tsx`

- Lista de missões pré-definidas divididas em duas categorias:
  - **Hoje**
  - **Esta semana**
- Cada missão possui:
  - `id`
  - `title`
  - `description`
  - `xp`
  - `category`
- Ao tocar em uma missão:
  - Verifica se já foi concluída
  - Salva o progresso em `users/{uid}/missions/{missionId}`
  - Atualiza `users/{uid}/stats.xpTotal` somando o XP da missão
- UI inclui:
  - Cards com estado visual de **concluída** / **não concluída**
  - Marcadores de XP
  - Textos explicativos simples e objetivos

---

## 🤖 IA ÓRBITA – Assistente de Carreira com Gemini

Tela: `app/(tabs)/ai.tsx`  
Serviço: `app/services/ia.ts`

Integração com a API:

```http
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent
Content-Type: application/json
X-goog-api-key: SUA_API_KEY

{
  "contents": [
    {
      "parts": [
        { "text": "Mensagem do usuário aqui..." }
      ]
    }
  ]
}
```

No app:

- Interface de **chat** com bolhas (user x IA)
- Mensagem inicial da IA apresentando a ÓRBITA
- O nome do usuário (`displayName`) é utilizado no prompt para deixar a resposta mais pessoal
- Loading com texto **“ÓRBITA está pensando...”**
- Tratamento de erro caso a IA não responda

A IA é usada para:

- Dúvidas sobre **carreira**  
- Próximos passos de estudo  
- Ideias de projetos e portfólio  
- Orientações gerais de evolução profissional  

---

## 🛰️ Aba ÓRBITA – Integração com ESP32 (IoT)

Tela: `app/(tabs)/orbita.tsx`  
Servidor Node: `server.js` (projeto ÓRBITA Desk)

### 📡 Backend (server.js)

Servidor Express responsável por:

- Receber métricas via **POST /api/metrics**:
  - `userId`
  - `temperature`
  - `humidity`
  - `light`
  - `noise`
  - `score`
  - `working`
  - `workMinutes`
- Armazenar os últimos **N registros** em memória (`metrics[]`)
- Disponibilizar histórico via **GET /api/metrics**
- Possuir rota de **reset** (`POST /api/reset`) e `/` para dashboard web opcional

### 📲 Consumo no app

Na aba **ÓRBITA**:

- O app realiza **polling** periódico no endpoint `GET /api/metrics`
- Sempre pega o **último registro** da lista para exibir o estado atual
- Renderiza **3 gráficos em formato donut (SVG)**:

1. **Score de bem-estar**  
2. **Tempo focado no dia** (baseado em `workMinutes`)  
3. **Status atual** (trabalhando / pausa, baseado em `working`)  

Tecnologia usada para gráficos:

```tsx
import { Svg, Circle, G } from "react-native-svg";
```

Além dos donuts, a tela exibe cards com:

- Temperatura (°C)
- Umidade (%)
- Luz (lux ou unidade do sensor)
- Ruído (dB ou escala utilizada)

E um rodapé com **“Última leitura: HH:MM:SS”**.

> Essa tela conecta o tema **Futuro do Trabalho** com **bem-estar e produtividade**, monitorando o ambiente físico do estudante/trabalhador.

---

## 👤 Perfil – Dados do Usuário + Ações

Tela: `app/(tabs)/explore.tsx`

Inclui:

- Card com:
  - Nome
  - Email
  - Área de interesse
  - Tempo disponível
- Botão **“Alterar preferências”**:
  - Redireciona para `app/onboarding.tsx`
  - Ao salvar novamente, as mudanças já impactam as outras abas
- Botão **Logout**:
  - Faz `signOut(auth)`
  - Usa `router.replace("/")` para voltar para a tela de Login (`app/index.tsx`)
- Layout seguindo o mesmo padrão visual premium do resto do app

---

## 🧱 Organização de Pastas

```text
app/
  index.tsx            # Login
  register.tsx         # Registro
  onboarding.tsx       # Onboarding de preferências
  modal.tsx            # Detalhes de trilhas/cursos (se aplicável)

  (tabs)/
    _layout.tsx        # Configuração das tabs (Meu Futuro, Missões, Órbita, IA ÓRBITA, Perfil)
    index.tsx          # Meu Futuro
    missions.tsx       # Missões
    orbita.tsx         # Dashboard ESP32
    ai.tsx             # IA ÓRBITA
    explore.tsx        # Perfil

components/
  UIInput.tsx          # Input customizado com ícone
  UIButton.tsx         # Botão primário customizado
  UICard.tsx           # Card genérico reutilizável
  ...

constants/
  theme.ts             # COLORS, SIZES, etc.

services/
  firebase.ts          # Configuração Firebase
  ia.ts                # Serviço de chamada à API Gemini
```

---

## ⚙️ Tecnologias e Dependências Principais

- **React Native** + **Expo**
- **Expo Router**
- **TypeScript**
- **Firebase Authentication**
- **Firebase Realtime Database**
- **Google Gemini 2.0 Flash API**
- **react-native-svg** (gráficos donut)
- **Ionicons** (ícones)
- **Animated API do React Native** (animações de entrada)

---

## 🛠️ Como Rodar o Projeto

### 1️⃣ Clonar o repositório

```bash
git clone https://github.com/SEU-USUARIO/orbita-mobile.git
cd orbita-mobile
```

### 2️⃣ Instalar dependências

```bash
npm install
```

Instalar libs específicas do Expo:

```bash
npx expo install react-native-svg
npx expo install react-native-reanimated
```

### 3️⃣ Configurar o Firebase

Criar `services/firebase.ts` (se ainda não existir) com algo semelhante a:

```ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_DOMINIO.firebaseapp.com",
  databaseURL: "https://SEU_PROJETO.firebaseio.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getDatabase(app);
```

### 4️⃣ Configurar a IA (Gemini)

No arquivo `services/ia.ts`, definir sua API key do Gemini:

```ts
const GEMINI_API_KEY = "SUA_API_KEY_GEMINI";
```

A chamada segue o padrão da rota `generateContent`.

### 5️⃣ Rodar o app

```bash
npx expo start
```

Escanear o QR Code com o app **Expo Go** ou rodar no emulador.

---

## 🌐 Testando a Integração com ESP32 / Backend

### Backend (Node)

No projeto correspondente ao **server.js**:

```bash
node server.js
```

Por padrão, o servidor roda em:  
`http://localhost:3000`

### Exemplo de payload do ESP32

```json
{
  "userId": "orbita-001",
  "temperature": 25.3,
  "humidity": 58,
  "light": 810,
  "noise": 35,
  "score": 78,
  "working": true,
  "workMinutes": 90
}
```

Enviado via:

```http
POST http://localhost:3000/api/metrics
Content-Type: application/json
```

O app consome `GET /api/metrics` e exibe o último dado recebido.

---

## 🎓 Alinhamento com a Global Solution (Mobile Development)

- **Tema – Futuro do Trabalho**  
  - IA orientando decisões de carreira  
  - Integração com dados fisiológicos/ambientais (ESP32)  
  - Foco em bem-estar, produtividade e aprendizagem contínua

- **Boas práticas de desenvolvimento mobile**  
  - Hooks (`useState`, `useEffect`)  
  - Componentização (`UIInput`, `UIButton`, `UICard`)  
  - Navegação declarativa (Expo Router)  
  - Separação de camadas (services, constants, components, app)

- **Persistência de dados**  
  - Firebase Realtime Database para perfil, stats e missões

- **Integração com IA**  
  - Uso de API externa (Google Gemini) conforme solicitado na GS

- **Experiência do Usuário (UX/UI)**  
  - Layout dark premium
  - Telas consistentes visualmente
  - Feedbacks visuais (erros, loading, estados)

---

## 👨‍🚀 Autor

Projeto desenvolvido por:

**Kaue Pastori Teixeira** 
**Nicolas Nogueira Boni**
**Felipe Bressane**

---

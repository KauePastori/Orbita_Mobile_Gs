// services/ia.ts

// ⚠️ IMPORTANTE:
// - Troque pela SUA chave real do Gemini.
// - NÃO comite isso em repositório público.
const GEMINI_API_KEY = "AIzaSyC3F5knUa2cKLwgDr25qHe2zat9AympPtg";

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

/**
 * message: pergunta do usuário
 * userName: nome do usuário para a IA usar na resposta
 */
export async function askOrbitaAI(
  message: string,
  userName?: string
): Promise<string> {
  try {
    const nameSnippet = userName
      ? `O nome do usuário é ${userName}. Chame-o pelo nome nas respostas e use um tom amigável e motivador.`
      : `Chame o usuário de Explorador(a) e use um tom amigável e motivador.`;

    const body = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text:
                nameSnippet +
                "\n\nPergunta do usuário:\n" +
                message,
            },
          ],
        },
      ],
    };

    const response = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      console.log("Erro na Orbita IA:", text);
      throw new Error("Falha ao consultar a IA.");
    }

    const json = await response.json();

    const textResponse =
      json?.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Não consegui gerar uma resposta agora. Tente novamente em alguns instantes.";

    return textResponse;
  } catch (err) {
    console.log("Erro em askOrbitaAI:", err);
    throw err;
  }
}

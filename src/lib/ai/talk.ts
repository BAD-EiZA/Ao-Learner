import { GoogleGenerativeAI } from "@google/generative-ai";
import { withGeminiKey } from "@/lib/ai/gemini-keys";
import { GEMINI_MODEL } from "@/lib/constants";

export type TalkTurn = { role: "user" | "tutor"; text: string };

export async function aoConversation(params: {
  language: "English" | "German" | "French";
  history: TalkTurn[];
  userMessage: string;
  level?: string;
}): Promise<{ reply: string; audio_content: string | null; audio_mime: string | null }> {
  const hist = params.history
    .slice(-8)
    .map((t) => `${t.role === "user" ? "Student" : "Ao"}: ${t.text}`)
    .join("\n");

  const prompt = `You are Ao, a friendly ${params.language} speaking tutor (CEFR ${params.level ?? "A1"}).
Keep replies SHORT (1–2 sentences) in ${params.language} only.
Gently correct if student makes a clear error; otherwise continue natural conversation.
Topics: greetings, café, directions, daily life.
Conversation so far:
${hist || "(start)"}
Student: ${params.userMessage}
Ao:`;

  const text = await withGeminiKey(async (apiKey) => {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    const result = await model.generateContent(prompt);
    return result.response.text().trim().slice(0, 400);
  });

  // Chat-only: no TTS (faster / cheaper). Learn evaluate still uses speech.
  return {
    reply: text,
    audio_content: null,
    audio_mime: null,
  };
}

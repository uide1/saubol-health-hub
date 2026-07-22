import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
});

const InputSchema = z.object({
  messages: z.array(MessageSchema).min(1),
  lang: z.enum(["kk", "ru", "en"]).default("ru"),
});

const SYSTEM: Record<string, string> = {
  kk: "Сен SauBol AI — жедел жәрдем триаж көмекшісісің. Қысқа, нақты, эмпатиямен жауап бер. Симптомдарды талдап, қосымша сұрақтар қой, қауіп деңгейін бағала (жеңіл/орташа/жоғары), үй жағдайында не істеу керектігін ұсын, қажет болса 103 шақыруға кеңес бер. Диагноз қоймайсың, тек триаж жасайсың. 2–5 сөйлеммен жауап бер. Қазақ тілінде жауап бер.",
  ru: "Ты — SauBol AI, ассистент неотложной медицинской сортировки (triage). Отвечай кратко, по делу и с эмпатией. Проанализируй симптомы, задай уточняющие вопросы, оцени уровень риска (низкий/средний/высокий), дай практические рекомендации на дом и при необходимости порекомендуй вызов 103. Ты не ставишь диагноз, только сортируешь. Отвечай в 2–5 предложениях. Отвечай на русском.",
  en: "You are SauBol AI, an emergency medical triage assistant. Reply briefly, precisely and with empathy. Analyse symptoms, ask targeted follow-up questions, assess risk (low / medium / high), give practical home guidance and, when warranted, advise calling 103. You do not diagnose, only triage. Answer in 2–5 sentences. Reply in English.",
};

export const triageChat = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");
    const gateway = createLovableAiGatewayProvider(key);

    const { text } = await generateText({
      model: gateway("google/gemini-3.6-flash"),
      system: SYSTEM[data.lang],
      messages: data.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    return { text };
  });

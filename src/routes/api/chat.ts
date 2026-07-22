import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM = `You are SauBol AI — a medical triage assistant for Kazakhstan. Reply in the user's language (Kazakh / Russian / English).
STYLE: keep replies SHORT (60-120 words max). No long essays. Use max 3-5 short bullets. One follow-up question only if truly needed.
CONTENT: focus on the exact symptom asked, brief practical advice, and 1-2 red flags. Never diagnose; suggest likely causes.
EMERGENCY: if signs of a real emergency (chest pain + dyspnea, stroke signs FAST, anaphylaxis, severe bleeding, unconsciousness), START with "🚨 ШҰҒЫЛ / СРОЧНО / URGENT — 103" and give 2-3 lines only.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as { messages?: UIMessage[] };
        if (!Array.isArray(messages)) return new Response("bad request", { status: 400 });
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("LOVABLE_API_KEY missing", { status: 500 });
        const gw = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gw("google/gemini-2.5-flash"),
          system: SYSTEM,
          messages: await convertToModelMessages(messages),
        });
        return result.toUIMessageStreamResponse({ originalMessages: messages });
      },
    },
  },
});

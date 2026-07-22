import { createFileRoute } from "@tanstack/react-router";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

const SYSTEM = `You are SauBol AI — a medical triage assistant for Kazakhstan. Reply in the language of the user (Kazakh / Russian / English).
- Ask focused clarifying questions about symptoms (onset, duration, severity, location, associated symptoms).
- Give concrete, practical home-care advice AND clear red flags for when to call 103 or go to ER.
- Be warm but concise; use bullet points where helpful.
- Never diagnose definitively — suggest likely causes and next steps.
- If the symptoms sound like a medical emergency (chest pain + shortness of breath, stroke signs, severe abdominal pain, anaphylaxis, heavy bleeding, unconsciousness), START the reply with "🚨 ШҰҒЫЛ / СРОЧНО / URGENT — call 103 immediately." and then explain briefly.`;

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

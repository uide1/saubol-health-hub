import { createFileRoute } from "@tanstack/react-router";
import { streamText, type ModelMessage } from "ai";
import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";

const SYSTEM_PROMPT = `Сен — SauBol AI, қазақстандық медициналық көмекші-ассистент. Ережелер:
- Сен диагноз ҚОЙМАЙСЫҢ. Тек ақпарат, ықтимал себептер, жалпы ұсыныстар бересің.
- Әр жауаптың соңында дәрігерге баруды ЕСКЕРТЕСІҢ.
- Егер симптомдар қауіпті болса (кеуде ауруы, қатты қан кету, тыныс алудың бұзылуы, естен тану) — дереу 103 (жедел жәрдем) шақыруды АЙТ.
- Жауап қысқа, жылы, кәсіби. Markdown қолдан (тізімдер, bold).
- Пайдаланушы қай тілде жазса — сол тілде жауап бер (қазақ / орыс / ағылшын).
- Ешқашан нақты дәрі-дәрмек дозасын тағайындама.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { messages?: ModelMessage[] };
        if (!Array.isArray(body.messages)) {
          return new Response("messages required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const gateway = createLovableAiGatewayProvider(key);
        const result = streamText({
          model: gateway("openai/gpt-5.5"),
          system: SYSTEM_PROMPT,
          messages: body.messages,
        });
        return result.toTextStreamResponse();
      },
    },
  },
});

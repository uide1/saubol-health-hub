import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";
import { generateText, Output, NoObjectGeneratedError } from "ai";

const FoodSchema = z.object({
  name: z.string(),
  calories: z.number(),
  carbs_g: z.number(),
  protein_g: z.number(),
  fat_g: z.number(),
  warning: z.string().nullable(),
});
export type FoodResult = z.infer<typeof FoodSchema>;

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const gw = createLovableAiGatewayProvider(key);
  return gw("google/gemini-2.5-flash");
}

async function analyze(prompt: string, imageDataUrl?: string, allergies?: string): Promise<FoodResult> {
  const model = getModel();
  const sys = `You are a nutrition analyst. Return JSON with fields: name (string), calories (kcal number), carbs_g, protein_g, fat_g, warning (string or null). Warning is a short medical note if user's allergies/conditions conflict. User allergies/conditions: ${allergies ?? "none"}. Be realistic — a typical serving size.`;
  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: FoodSchema }),
      messages: [
        { role: "system", content: sys },
        {
          role: "user",
          content: imageDataUrl
            ? [
                { type: "text", text: prompt },
                { type: "image", image: imageDataUrl },
              ]
            : [{ type: "text", text: prompt }],
        },
      ],
    });
    return output;
  } catch (e) {
    if (NoObjectGeneratedError.isInstance(e)) {
      return { name: "Unknown food", calories: 0, carbs_g: 0, protein_g: 0, fat_g: 0, warning: "AI could not parse; please enter manually." };
    }
    throw e;
  }
}

export const analyzeFoodPhoto = createServerFn({ method: "POST" })
  .inputValidator((d: { imageDataUrl: string; allergies?: string }) => d)
  .handler(async ({ data }) => analyze("Identify this food and estimate nutrition for one serving.", data.imageDataUrl, data.allergies));

export const analyzeBarcode = createServerFn({ method: "POST" })
  .inputValidator((d: { barcode: string; allergies?: string }) => d)
  .handler(async ({ data }) =>
    analyze(`Barcode ${data.barcode}. Identify this product and give per-serving nutrition. If unknown, guess a plausible packaged food and note in warning.`, undefined, data.allergies)
  );

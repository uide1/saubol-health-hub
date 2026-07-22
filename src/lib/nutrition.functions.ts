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

const INSTRUCTIONS = (allergies?: string) =>
  `You are a nutrition analyst. Respond in JSON with fields name, calories (kcal), carbs_g, protein_g, fat_g, warning. Warning is a short medical note (<=90 chars) if the food conflicts with user allergies/conditions, otherwise null. Assume one typical serving. User allergies/conditions: ${allergies ?? "none"}.`;

function getModel() {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");
  const gw = createLovableAiGatewayProvider(key);
  return gw("google/gemini-2.5-flash");
}

export const analyzeFoodPhoto = createServerFn({ method: "POST" })
  .inputValidator((d: { imageDataUrl: string; allergies?: string }) => d)
  .handler(async ({ data }) => {
    const model = getModel();
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: FoodSchema }),
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: `${INSTRUCTIONS(data.allergies)}\n\nIdentify this food and estimate nutrition for one serving.` },
              { type: "image", image: data.imageDataUrl },
            ],
          },
        ],
      });
      return output;
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) {
        return { name: "Unknown food", calories: 0, carbs_g: 0, protein_g: 0, fat_g: 0, warning: "AI could not parse this photo; try a clearer angle." } as FoodResult;
      }
      throw e;
    }
  });

export const analyzeBarcode = createServerFn({ method: "POST" })
  .inputValidator((d: { barcode: string; allergies?: string }) => d)
  .handler(async ({ data }) => {
    const model = getModel();
    try {
      const { output } = await generateText({
        model,
        output: Output.object({ schema: FoodSchema }),
        prompt: `${INSTRUCTIONS(data.allergies)}\n\nBarcode: ${data.barcode}. Identify this product (packaged food, Kazakhstan/EU/US markets) and give per-serving nutrition. If unknown, make a plausible guess and note that in warning.`,
      });
      return output;
    } catch (e) {
      if (NoObjectGeneratedError.isInstance(e)) {
        return { name: `Product ${data.barcode}`, calories: 0, carbs_g: 0, protein_g: 0, fat_g: 0, warning: "AI could not identify this barcode." } as FoodResult;
      }
      throw e;
    }
  });

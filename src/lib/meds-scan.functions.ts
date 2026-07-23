import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

type ScanInput = { imageDataUrl: string; targetUserId: string };

export const scanPrescriptionPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => {
    const i = input as ScanInput;
    if (!i?.imageDataUrl || !i.imageDataUrl.startsWith("data:image/")) {
      throw new Error("Invalid image");
    }
    if (!i.targetUserId) throw new Error("Missing targetUserId");
    return i;
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Authorization: user can manage themselves, or child via family_links
    if (data.targetUserId !== userId) {
      const { data: canManage, error: rpcErr } = await supabase.rpc("can_manage_user_data", {
        _manager: userId,
        _target: data.targetUserId,
      });
      if (rpcErr || !canManage) throw new Error("Forbidden");
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const systemPrompt = `You are a medical assistant that reads prescription photos, medication boxes, or handwritten drug lists. Extract every distinct medication with a sensible daily schedule.

For each medication, return an object per intake time (one row per time-of-day). Times must be in 24-hour HH:MM format. If the prescription says "3 times a day", split into 08:00, 14:00, 20:00. If it says "morning and evening", use 08:00 and 20:00. If it says "before bed", use 22:00. If unclear, default to 09:00.

The "note" should contain dose (e.g. "1 tablet", "500 mg", "10 ml") and any short instruction ("after food", "with water"). Keep notes under 80 characters. Use the same language as the prescription (Russian/Kazakh/English). If nothing readable is found, return an empty array.`;

    const body = {
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract the medication schedule from this image." },
            { type: "image_url", image_url: { url: data.imageDataUrl } },
          ],
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_schedule",
            description: "Save the extracted medication schedule",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string", description: "Medication name" },
                      time: { type: "string", description: "HH:MM 24-hour" },
                      note: { type: "string", description: "Dose and instructions" },
                    },
                    required: ["name", "time", "note"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["items"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_schedule" } },
    };

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      if (resp.status === 429) throw new Error("AI rate limit — try again in a moment");
      if (resp.status === 402) throw new Error("AI credits exhausted");
      throw new Error(`AI error ${resp.status}: ${text.slice(0, 200)}`);
    }

    const json = await resp.json();
    const call = json?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = call?.function?.arguments;
    if (!argsStr) return { inserted: 0, items: [] as Array<{ name: string; time: string; note: string }> };

    let parsed: { items?: Array<{ name: string; time: string; note?: string }> } = {};
    try {
      parsed = JSON.parse(argsStr);
    } catch {
      throw new Error("AI returned invalid JSON");
    }

    const items = (parsed.items ?? [])
      .filter((it) => it?.name && /^\d{2}:\d{2}$/.test(it.time))
      .map((it) => ({
        user_id: data.targetUserId,
        name: it.name.trim().slice(0, 120),
        time: it.time,
        note: (it.note ?? "").trim().slice(0, 200) || null,
        taken: false,
      }));

    if (items.length === 0) return { inserted: 0, items: [] };

    const { error: insErr } = await supabase.from("medication_schedules").insert(items);
    if (insErr) throw new Error(insErr.message);

    return {
      inserted: items.length,
      items: items.map((i) => ({ name: i.name, time: i.time, note: i.note ?? "" })),
    };
  });

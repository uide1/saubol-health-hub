// Supabase/Lovable Cloud Edge Function.
// Вызывается по расписанию (Jobs / cron) раз в минуту.
// 1) Шлёт напоминания о лекарствах, если у кого-то сейчас время приёма.
// 2) Эскалирует алерты "похоже на падение", если pending дольше ESCALATION_MINUTES.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

const ESCALATION_MINUTES = 1;

function sendMessage(chatId: number, text: string) {
  return fetch(`${TG_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
}

async function checkMedications() {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const { data: meds, error } = await supabase.from("medication_schedules").select("*");
  if (error) {
    console.error("Ошибка чтения medication_schedules:", error);
    return;
  }

  const due = (meds || []).filter((m) => (m.time || "").slice(0, 5) === currentTime);
  if (due.length === 0) return;

  const userIds = [...new Set(due.map((m) => m.user_id))];
  const { data: profiles } = await supabase.from("profiles").select("id, telegram_chat_id").in("id", userIds);
  const chatById = new Map((profiles || []).map((p) => [p.id, p.telegram_chat_id]));

  for (const med of due) {
    const chatId = chatById.get(med.user_id);
    if (!chatId) continue;
    await sendMessage(chatId, `⏰ Время принять лекарство!\n${med.name}${med.note ? " — " + med.note : ""}`);
  }
}

async function checkFallAlertsEscalation() {
  const cutoff = new Date(Date.now() - ESCALATION_MINUTES * 60000).toISOString();

  const { data: alerts, error } = await supabase
    .from("fall_alerts")
    .select("*")
    .eq("status", "pending")
    .eq("escalated", false)
    .lt("created_at", cutoff);

  if (error) {
    console.error("Ошибка чтения fall_alerts:", error);
    return;
  }

  for (const alert of alerts || []) {
    const { data: marked } = await supabase
      .from("fall_alerts")
      .update({ escalated: true, escalated_at: new Date().toISOString() })
      .eq("id", alert.id)
      .eq("escalated", false)
      .select()
      .maybeSingle();

    if (!marked) continue; // кто-то уже эскалировал параллельно

    const { data: user } = await supabase.from("profiles").select("*").eq("id", alert.user_id).maybeSingle();
    const name = user?.full_name || user?.username || "пользователь";

    if (user?.telegram_chat_id) {
      await sendMessage(user.telegram_chat_id, "🚨 Ответа не было. Мы связались с твоим экстренным контактом.");
    }

    const { data: links } = await supabase
      .from("family_links")
      .select("parent_id")
      .eq("child_id", alert.user_id)
      .eq("status", "accepted");

    const parentIds = (links || []).map((l) => l.parent_id);
    if (parentIds.length === 0) continue;

    const { data: caregivers } = await supabase.from("profiles").select("*").in("id", parentIds);
    for (const c of caregivers || []) {
      if (!c.telegram_chat_id) continue;
      await sendMessage(
        c.telegram_chat_id,
        `🚨 Внимание! ${name} не ответил(а) на алерт "похоже на падение". Пожалуйста, проверьте, всё ли в порядке.`
      );
    }
  }
}

Deno.serve(async (_req) => {
  try {
    await checkMedications();
    await checkFallAlertsEscalation();
  } catch (err) {
    console.error("Ошибка check-reminders:", err);
  }
  return new Response("ok");
});

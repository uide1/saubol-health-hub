// Supabase/Lovable Cloud Edge Function.
// Вызывается Database Webhook'ом мгновенно при INSERT в таблицу fall_alerts —
// неважно, кто создал запись: сам бот (/fall) или сайт (страница "Сканер").
// Шлёт пациенту сообщение с кнопками "Я в порядке" / "Нужна помощь!".

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

function alertKeyboard(alertId: string) {
  return {
    inline_keyboard: [
      [
        { text: "✅ Я в порядке", callback_data: `ok:${alertId}` },
        { text: "🚨 Нужна помощь!", callback_data: `help:${alertId}` },
      ],
    ],
  };
}

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record; // строка fall_alerts, которую только что вставили

    if (!record || record.status !== "pending") {
      return new Response("skip");
    }

    const { data: user } = await supabase
      .from("profiles")
      .select("telegram_chat_id")
      .eq("id", record.user_id)
      .maybeSingle();

    if (!user?.telegram_chat_id) {
      console.log(`fall_alerts ${record.id}: у пользователя ${record.user_id} нет привязанного Telegram.`);
      return new Response("no telegram");
    }

    await fetch(`${TG_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: user.telegram_chat_id,
        text: "🆘 Похоже на падение! Ты в порядке?\n\nЕсли не ответишь в течение примерно минуты, мы свяжемся с твоим экстренным контактом.",
        reply_markup: alertKeyboard(record.id),
      }),
    });

    return new Response("ok");
  } catch (err) {
    console.error("Ошибка notify-fall-alert:", err);
    return new Response("error", { status: 500 });
  }
});

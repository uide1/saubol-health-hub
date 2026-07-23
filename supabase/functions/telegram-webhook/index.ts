// Supabase/Lovable Cloud Edge Function.
// Принимает вебхук от Telegram (сообщения и нажатия кнопок) и обрабатывает
// команды бота: /start CODE, /add, /list, /del, /fall.
//
// SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY подставляются автоматически
// средой выполнения — их не нужно задавать вручную в Secrets.
// Единственный секрет, который нужно добавить самому: TELEGRAM_BOT_TOKEN.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function tg(method: string, payload: Record<string, unknown>) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return res.json();
}

function sendMessage(chatId: number, text: string, extra: Record<string, unknown> = {}) {
  return tg("sendMessage", { chat_id: chatId, text, ...extra });
}

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

const mainMenu = {
  keyboard: [
    ["📋 Мои лекарства", "➕ Добавить лекарство"],
    ["🗑 Удалить лекарство", "🆘 Тест: похоже на падение"],
    ["❓ Помощь"],
  ],
  resize_keyboard: true,
};

async function getUserByChatId(chatId: number) {
  const { data } = await supabase.from("profiles").select("*").eq("telegram_chat_id", chatId).maybeSingle();
  return data;
}

async function requireUser(chatId: number) {
  const user = await getUserByChatId(chatId);
  if (!user) {
    await sendMessage(
      chatId,
      'Твой Telegram ещё не привязан.\n\nПерейди в профиль на сайте → "Привязать Telegram", получи код и отправь мне:\n/start КОД'
    );
  }
  return user;
}

async function handleStart(chatId: number, payload: string | null) {
  if (!payload) {
    const user = await getUserByChatId(chatId);
    await sendMessage(
      chatId,
      user
        ? `Привет, ${user.full_name || user.username}! Telegram уже привязан. 💊`
        : 'Привет! Привяжи Telegram к аккаунту на сайте: профиль → "Привязать Telegram", получи код, отправь мне:\n/start КОД',
      { reply_markup: mainMenu }
    );
    return;
  }

  const { data: user, error } = await supabase
    .from("profiles")
    .update({ telegram_chat_id: chatId, telegram_link_code: null })
    .eq("telegram_link_code", payload.trim())
    .select()
    .maybeSingle();

  if (error || !user) {
    await sendMessage(chatId, "Код недействителен или уже использован. Получи новый код в профиле на сайте.");
    return;
  }

  await sendMessage(chatId, `Готово ✅ Telegram привязан к аккаунту ${user.full_name || user.username}.`, {
    reply_markup: mainMenu,
  });
}

async function handleAdd(chatId: number, argsText: string) {
  const user = await requireUser(chatId);
  if (!user) return;

  const parts = argsText.split("|").map((p) => p.trim());
  if (parts.length !== 3) {
    await sendMessage(chatId, "Неверный формат. Пример:\n/add Аспирин|1 таблетка|08:00");
    return;
  }
  const [name, note, time] = parts;
  if (!name || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time)) {
    await sendMessage(chatId, "Проверь формат времени (ЧЧ:ММ). Пример:\n/add Аспирин|1 таблетка|08:00");
    return;
  }

  const { data: med, error } = await supabase
    .from("medication_schedules")
    .insert({ user_id: user.id, name, note, time })
    .select()
    .single();

  if (error) {
    await sendMessage(chatId, "Не получилось добавить. Попробуй ещё раз.");
    return;
  }

  await sendMessage(chatId, `Добавлено ✅\n${med.name}${med.note ? " — " + med.note : ""}\nВремя: ${time}`);
}

async function handleList(chatId: number) {
  const user = await requireUser(chatId);
  if (!user) return;

  const { data: meds } = await supabase
    .from("medication_schedules")
    .select("*")
    .eq("user_id", user.id)
    .order("time", { ascending: true });

  if (!meds || meds.length === 0) {
    await sendMessage(chatId, "Пока нет ни одного лекарства.\n\nНапиши:\n/add Название|Дозировка|08:00");
    return;
  }

  const text = meds
    .map((m) => `№${m.id.slice(0, 8)} ${m.name}${m.note ? " — " + m.note : ""}\nВремя: ${m.time.slice(0, 5)}`)
    .join("\n\n");
  await sendMessage(chatId, text);
}

async function handleDel(chatId: number, idText: string) {
  const user = await requireUser(chatId);
  if (!user) return;

  const { error, count } = await supabase
    .from("medication_schedules")
    .delete({ count: "exact" })
    .eq("id", idText.trim())
    .eq("user_id", user.id);

  await sendMessage(chatId, !error && count && count > 0 ? "Лекарство удалено." : "Не найдено. Полный ID можно взять через /list.");
}

async function handleFall(chatId: number) {
  const user = await requireUser(chatId);
  if (!user) return;

  const { error } = await supabase
    .from("fall_alerts")
    .insert({ user_id: user.id, status: "pending" });

  if (error) {
    await sendMessage(chatId, "Не получилось создать алерт. Попробуй ещё раз.");
  }
}


async function handleCallback(callbackQuery: any) {
  const chatId = callbackQuery.message.chat.id;
  const messageId = callbackQuery.message.message_id;
  const [action, alertId] = String(callbackQuery.data).split(":");

  const { data: alert } = await supabase.from("fall_alerts").select("*").eq("id", alertId).maybeSingle();

  if (!alert) {
    await tg("answerCallbackQuery", { callback_query_id: callbackQuery.id, text: "Алерт не найден." });
    return;
  }
  if (alert.status !== "pending") {
    await tg("answerCallbackQuery", { callback_query_id: callbackQuery.id, text: "На этот алерт уже был дан ответ." });
    return;
  }

  await supabase
    .from("fall_alerts")
    .update({ status: action === "ok" ? "ok" : "help", responded_at: new Date().toISOString() })
    .eq("id", alertId);

  const resultText = action === "ok" ? "✅ Отлично, рад что всё хорошо!" : "🚨 Понял, эта информация тоже уйдёт близкому контактом.";

  await tg("editMessageText", { chat_id: chatId, message_id: messageId, text: resultText });
  await tg("answerCallbackQuery", { callback_query_id: callbackQuery.id });

  if (action === "help") {
    await notifyCaregivers(alert.user_id, alert.id, "нажал(а) \"Нужна помощь!\" после алерта о падении");
  }
}

async function notifyCaregivers(userId: string, _alertId: string, reason: string) {
  const { data: links } = await supabase.from("family_links").select("parent_id").eq("child_id", userId).eq("status", "accepted");
  const parentIds = (links || []).map((l) => l.parent_id);
  if (parentIds.length === 0) return;

  const { data: caregivers } = await supabase.from("profiles").select("*").in("id", parentIds);
  const { data: user } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  const name = user?.full_name || user?.username || "пользователь";

  for (const c of caregivers || []) {
    if (!c.telegram_chat_id) continue;
    await sendMessage(c.telegram_chat_id, `🚨 ${name} ${reason}.`);
  }
}

const WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "";

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");

  if (WEBHOOK_SECRET) {
    const provided = req.headers.get("x-telegram-bot-api-secret-token") ?? "";
    if (provided !== WEBHOOK_SECRET) {
      return new Response("unauthorized", { status: 401 });
    }
  }

  const update = await req.json();

  try {
    if (update.callback_query) {
      await handleCallback(update.callback_query);
    } else if (update.message?.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text as string;

      if (text.startsWith("/start")) {
        const payload = text.split(" ")[1] ?? null;
        await handleStart(chatId, payload);
      } else if (text.startsWith("/add ")) {
        await handleAdd(chatId, text.slice(5));
      } else if (text === "/list" || text === "📋 Мои лекарства") {
        await handleList(chatId);
      } else if (text.startsWith("/del ")) {
        await handleDel(chatId, text.slice(5));
      } else if (text === "/fall" || text === "🆘 Тест: похоже на падение") {
        await handleFall(chatId);
      } else if (text === "➕ Добавить лекарство") {
        await sendMessage(chatId, "Напиши команду:\n/add Название|Дозировка|08:00");
      } else if (text === "🗑 Удалить лекарство") {
        await sendMessage(chatId, "Напиши команду:\n/del ID\n\n(ID смотри через /list)");
      } else if (text === "❓ Помощь" || text === "/help") {
        await sendMessage(chatId, "/add Название|Дозировка|08:00\n/list\n/del ID\n/fall — тестовый алерт");
      }
    }
  } catch (err) {
    console.error("Ошибка обработки апдейта:", err);
  }

  return new Response("ok");
});

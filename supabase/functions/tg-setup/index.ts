// One-off helper: registers the Telegram webhook with the secret token.
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;

Deno.serve(async () => {
  const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];
  const webhookUrl = `https://${projectRef}.functions.supabase.co/telegram-webhook`;

  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: webhookUrl,
      secret_token: SECRET,
      allowed_updates: ["message", "callback_query"],
    }),
  });
  const body = await res.json();
  return new Response(JSON.stringify({ webhookUrl, body }, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
});

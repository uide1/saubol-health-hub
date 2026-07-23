import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bento, Badge, SectionEyebrow } from "@/components/ui-kit";
import { useL, L } from "@/lib/i18n";
import { useMyProfile, resolveAvatarUrl } from "@/lib/auth";
import { ProfileFormModal } from "@/components/profile-form-modal";
import { supabase } from "@/integrations/supabase/client";
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export const Route = createFileRoute("/_authenticated/profile")({

  head: () => ({
    meta: [
      { title: "Профиль — SauBol AI" },
      { name: "description", content: "Жеке медициналық профиль." },
      { property: "og:title", content: "Профиль · SauBol AI" },
      { property: "og:description", content: "Сіздің денсаулық журналыңыз бір орында." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, profile, refetch } = useMyProfile();
  const L1 = useL();
  const [editOpen, setEditOpen] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    resolveAvatarUrl(profile?.avatar_url).then(setAvatar);
  }, [profile?.avatar_url]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  };

  const onPickAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;
    if (file.size > 3 * 1024 * 1024) { toast.error(L1({ kk: "Файл 3МБ-дан аспау керек", ru: "Файл до 3МБ", en: "Max 3MB" })); return; }
    setUploading(true);
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${profile.id}/avatar-${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) { setUploading(false); toast.error(upErr.message); return; }
    const { error: dbErr } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", profile.id);
    setUploading(false);
    if (dbErr) { toast.error(dbErr.message); return; }
    toast.success(L1({ kk: "Аватар жаңартылды", ru: "Аватар обновлён", en: "Avatar updated" }));
    refetch();
    e.target.value = "";
  };

  if (!profile) {
    return <div className="py-20 text-center text-sm text-muted-foreground">…</div>;
  }

  const initials = ((profile.first_name?.[0] ?? profile.username?.[0] ?? "?") + (profile.last_name?.[0] ?? "")).toUpperCase();
  const bmi = profile.height_cm && profile.weight_kg
    ? (Number(profile.weight_kg) / Math.pow(profile.height_cm / 100, 2)).toFixed(1)
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <Bento className="noise relative flex items-center gap-6 overflow-hidden p-8">
          <div className="aurora opacity-20" />
          <label className="group relative grid h-24 w-24 shrink-0 cursor-pointer place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[color:var(--mint)] to-emerald-800 font-serif text-4xl text-background" title={L1({ kk: "Фотоны ауыстыру", ru: "Сменить фото", en: "Change photo" })}>
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
            <span className="absolute inset-0 grid place-items-center bg-black/50 text-[10px] uppercase tracking-widest text-white opacity-0 transition group-hover:opacity-100">
              {uploading ? "…" : <L kk="Өзгерту" ru="Сменить" en="Change" />}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={onPickAvatar} disabled={uploading} />
          </label>
          <div className="relative flex-1 min-w-0">
            <SectionEyebrow>
              <L kk="Пациент профилі" ru="Профиль пациента" en="Patient profile" /> · <span className="font-mono">{profile.public_id}</span>
            </SectionEyebrow>
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-foreground">
              {profile.full_name ?? profile.username ?? user?.email}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              @{profile.username}
              {profile.age && <> · {profile.age} {L1({ kk: "жас", ru: "лет", en: "y.o." })}</>}
              {profile.blood_type && <> · {profile.blood_type}</>}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {profile.allergies && <Badge tone="warning">⚠ {profile.allergies}</Badge>}
              {bmi && <Badge tone="muted">BMI {bmi}</Badge>}
              <Badge tone="mint">SauBol</Badge>
            </div>
          </div>
          <div className="relative flex flex-col gap-2">
            <button onClick={() => setEditOpen(true)} className="rounded-full bg-foreground px-4 py-2 text-xs font-medium text-background">
              <L kk="Өңдеу" ru="Изменить" en="Edit" />
            </button>
            <button onClick={() => { navigator.clipboard.writeText(profile.public_id!); toast.success(L1({ kk: "ID көшірілді", ru: "ID скопирован", en: "ID copied" })); }} className="rounded-full border border-border bg-surface px-4 py-2 text-xs text-foreground">
              <L kk="ID көшіру" ru="Копир. ID" en="Copy ID" />
            </button>
            <button onClick={signOut} className="rounded-full border border-border bg-surface px-4 py-2 text-xs text-muted-foreground hover:text-foreground">
              <L kk="Шығу" ru="Выйти" en="Sign out" />
            </button>
          </div>
        </Bento>

        <Bento className="grid grid-cols-2 gap-3 p-5">
          <Metric label={L1({ kk: "Бой", ru: "Рост", en: "Height" })} value={profile.height_cm ? `${profile.height_cm}` : "—"} unit="cm" />
          <Metric label={L1({ kk: "Салмақ", ru: "Вес", en: "Weight" })} value={profile.weight_kg ? `${profile.weight_kg}` : "—"} unit="kg" />
          <Metric label={L1({ kk: "Жас", ru: "Возраст", en: "Age" })} value={profile.age?.toString() ?? "—"} unit={L1({ kk: "ж", ru: "лет", en: "y" })} />
          <Metric label="BMI" value={bmi ?? "—"} unit="" />
        </Bento>
      </div>

      <TelegramLink profileId={profile.id} chatId={profile.telegram_chat_id} linkCode={profile.telegram_link_code} onChange={refetch} />

      <HealthWidgets />

      <ProfileFormModal mode="edit" open={editOpen} profile={profile} onClose={() => setEditOpen(false)} onSaved={refetch} />
    </div>
  );
}

function HealthWidgets() {
  const L1 = useL();
  const [water, setWater] = useState(5);
  const [mood, setMood] = useState<number | null>(3);
  const sleep = [6.2, 7.1, 5.8, 7.8, 6.9, 8.1, 7.4];
  const hrSeries = [
    { t: "00", v: 62 }, { t: "04", v: 58 }, { t: "08", v: 74 },
    { t: "12", v: 82 }, { t: "14", v: 91 }, { t: "18", v: 78 }, { t: "22", v: 66 },
  ];
  const weekLabels = ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"];
  const moods = ["😔","😐","🙂","😊","🤩"];
  const timeline = [
    { time: "09:12", icon: "💊", tone: "mint" as const, label: L1({ kk: "Ferrum 100мг қабылданды", ru: "Принят Ferrum 100мг", en: "Ferrum 100mg taken" }) },
    { time: "08:40", icon: "🥗", tone: "muted" as const, label: L1({ kk: "Таңғы ас · 420 ккал", ru: "Завтрак · 420 ккал", en: "Breakfast · 420 kcal" }) },
    { time: "07:55", icon: "🏃", tone: "mint" as const, label: L1({ kk: "Жүру · 2.4 км", ru: "Ходьба · 2.4 км", en: "Walk · 2.4 km" }) },
    { time: "07:10", icon: "😴", tone: "muted" as const, label: L1({ kk: "Ұйқы · 7с 24м · терең фаза 22%", ru: "Сон · 7ч 24м · глубокая фаза 22%", en: "Sleep · 7h 24m · deep 22%" }) },
    { time: "06:45", icon: "❤️", tone: "warning" as const, label: L1({ kk: "Демалыс ЖСС 62 bpm", ru: "Пульс покоя 62 bpm", en: "Resting HR 62 bpm" }) },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Bento className="lg:col-span-2">
          <div className="mb-3 flex items-end justify-between">
            <div>
              <SectionEyebrow><L kk="Жүрек соғысы · 24 сағат" ru="Пульс · 24 часа" en="Heart rate · 24h" /></SectionEyebrow>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-3xl text-foreground">72</span>
                <span className="text-[11px] text-muted-foreground">bpm avg</span>
                <Badge tone="mint">–4 vs {L1({ kk: "апта", ru: "неделя", en: "week" })}</Badge>
              </div>
            </div>
            <div className="text-right text-[10px] text-muted-foreground">
              <div><L kk="Мин" ru="Мин" en="Min" /> <span className="font-mono text-foreground">58</span></div>
              <div><L kk="Макс" ru="Макс" en="Max" /> <span className="font-mono text-foreground">91</span></div>
            </div>
          </div>
          <div className="h-32">
            <ResponsiveContainer>
              <AreaChart data={hrSeries} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="hrFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--mint)" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="var(--mint)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" tick={{ fill: "var(--muted-foreground)", fontSize: 10 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }} labelStyle={{ color: "var(--muted-foreground)" }} />
                <Area type="monotone" dataKey="v" stroke="var(--mint)" strokeWidth={2} fill="url(#hrFill)" activeDot={{ r: 4, fill: "var(--mint)" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Bento>

        <Bento className="rounded-[32px]">
          <SectionEyebrow><L kk="Су · бүгін" ru="Вода · сегодня" en="Water · today" /></SectionEyebrow>
          <div className="mt-2 flex items-center gap-4">
            <div className="relative grid h-24 w-24 shrink-0 place-items-center">
              <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--secondary)" strokeWidth="8" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="var(--mint)" strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 42}
                  strokeDashoffset={2 * Math.PI * 42 * (1 - water / 8)} />
              </svg>
              <div className="text-center">
                <div className="font-serif text-2xl text-foreground tabular-nums">{water}<span className="text-xs text-muted-foreground">/8</span></div>
                <div className="text-[9px] uppercase tracking-widest text-muted-foreground">💧</div>
              </div>
            </div>
            <div className="flex-1">
              <div className="font-serif text-2xl text-foreground">{(water * 0.25).toFixed(2)}<span className="text-sm text-muted-foreground"> / 2.00 L</span></div>
              <div className="mt-1 text-[11px] text-muted-foreground"><L kk="Күндік мақсат" ru="Дневная цель" en="Daily goal" /></div>
              <div className="mt-3 flex gap-2">
                <button onClick={() => { setWater(w => Math.min(8, w + 1)); toast.success(L1({ kk: "+250 мл", ru: "+250 мл", en: "+250 ml" })); }} className="flex-1 rounded-full bg-foreground py-1.5 text-[11px] font-medium text-background">+ 250 мл</button>
                <button onClick={() => setWater(0)} className="rounded-full border border-border px-3 py-1.5 text-[11px] text-muted-foreground hover:text-foreground"><L kk="Тазалау" ru="Сброс" en="Reset" /></button>
              </div>
            </div>
          </div>
        </Bento>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Bento className="bg-gradient-to-br from-[color:var(--mint-soft)]/40 via-card to-card">
          <SectionEyebrow><L kk="Ұйқы · 7 күн" ru="Сон · 7 дней" en="Sleep · 7 days" /></SectionEyebrow>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-3xl text-foreground">{(sleep.reduce((a,b)=>a+b,0)/sleep.length).toFixed(1)}<span className="text-base text-muted-foreground">ч</span></span>
            <Badge tone="mint">+0.4</Badge>
          </div>
          <div className="mt-4 flex h-28 items-stretch gap-2">
            {sleep.map((h, i) => {
              const pct = Math.min(100, (h / 9) * 100);
              const ok = h >= 7;
              return (
                <div key={i} className="group flex flex-1 flex-col items-center gap-1">
                  <div className="relative flex h-full w-full items-end">
                    <div style={{ height: `${pct}%` }} className={`w-full rounded-md ${ok ? "bg-gradient-to-t from-[color:var(--mint-soft)] to-[color:var(--mint)]" : "bg-gradient-to-t from-surface to-muted-foreground/40"} transition group-hover:opacity-80`} />
                    <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[9px] text-background opacity-0 transition group-hover:opacity-100">{h}ч</span>
                  </div>
                  <span className="text-[9px] text-muted-foreground">{weekLabels[i]}</span>
                </div>
              );
            })}
          </div>
        </Bento>

        <Bento className="rounded-[32px]">
          <SectionEyebrow><L kk="Бүгінгі көңіл-күй" ru="Настроение сегодня" en="Today's mood" /></SectionEyebrow>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-3xl text-foreground">{mood !== null ? moods[mood] : "—"}</span>
            <span className="text-[11px] text-muted-foreground"><L kk="8 күн тізбегі" ru="серия 8 дней" en="8-day streak" /></span>
          </div>
          <div className="mt-3 flex gap-1.5">
            {moods.map((m, i) => (
              <button key={i} onClick={() => { setMood(i); toast(m); }}
                className={`grid h-12 flex-1 place-items-center rounded-full border text-xl transition ${mood === i ? "border-[color:var(--mint)] bg-[color:var(--mint-soft)] scale-110" : "border-border bg-surface hover:border-[color:var(--mint)]/40"}`}
              >{m}</button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
            {[
              [L1({ kk: "Күйзеліс", ru: "Стресс", en: "Stress" }), "Low"],
              [L1({ kk: "Энергия", ru: "Энергия", en: "Energy" }), "78%"],
              [L1({ kk: "Фокус", ru: "Фокус", en: "Focus" }), "Good"],
            ].map(([k, v]) => (
              <div key={k} className="rounded-full border border-border bg-surface px-2 py-1.5">
                <div className="uppercase tracking-wider text-muted-foreground">{k}</div>
                <div className="mt-0.5 font-semibold text-foreground">{v}</div>
              </div>
            ))}
          </div>
        </Bento>

        <Bento className="relative">
          <span className="absolute left-0 top-6 bottom-6 w-[3px] rounded-r bg-[color:var(--mint)]" />
          <SectionEyebrow><L kk="Соңғы белсенділік" ru="Последняя активность" en="Recent activity" /></SectionEyebrow>
          <ol className="mt-2 space-y-2">
            {timeline.map((e, i) => (
              <li key={i} className="flex items-center gap-3 rounded-xl border border-border/50 bg-surface/40 px-3 py-2">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border bg-card text-sm">{e.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[12px] text-foreground">{e.label}</div>
                  <div className="text-[10px] text-muted-foreground tabular-nums">{e.time}</div>
                </div>
                <Badge tone={e.tone}>·</Badge>
              </li>
            ))}
          </ol>
        </Bento>
      </div>
    </>
  );
}

function Metric({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="font-serif text-3xl text-foreground">{value}</span>
        {unit && <span className="text-[11px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

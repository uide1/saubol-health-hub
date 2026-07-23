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

  useEffect(() => {
    resolveAvatarUrl(profile?.avatar_url).then(setAvatar);
  }, [profile?.avatar_url]);

  const signOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth";
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
          <div className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[color:var(--mint)] to-emerald-800 font-serif text-4xl text-background">
            {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials}
          </div>
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

      <ProfileFormModal mode="edit" open={editOpen} profile={profile} onClose={() => setEditOpen(false)} onSaved={refetch} />
    </div>
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

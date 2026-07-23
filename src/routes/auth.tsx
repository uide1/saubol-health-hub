import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { L, useL } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Кіру · SauBol AI" },
      { name: "description", content: "Sign in to SauBol AI — connect with your family and get personal medical guidance." },
      { property: "og:title", content: "SauBol AI — Sign In" },
      { property: "og:description", content: "Access your family health hub." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const L1 = useL();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { first_name: firstName, last_name: lastName },
          },
        });
        if (error) throw error;
        toast.success(L1({ kk: "Тіркелдіңіз!", ru: "Готово!", en: "Signed up!" }));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.message ?? "Auth error");
    } finally {
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
      if (result?.error) throw new Error((result.error as any)?.message ?? "OAuth error");
      if (!result?.redirected) navigate({ to: "/" });
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto mt-8 max-w-md">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8">
        <div className="aurora opacity-30" />
        <div className="relative">
          <Link to="/" className="mb-6 inline-flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--mint)] text-xs font-bold text-background">S</div>
            <span className="font-serif text-xl text-foreground">SauBol AI</span>
          </Link>
          <h1 className="font-serif text-3xl text-foreground">
            {mode === "in" ? <L kk="Қош келдіңіз" ru="С возвращением" en="Welcome back" /> : <L kk="Есептік жазба құру" ru="Создать аккаунт" en="Create account" />}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <L kk="Отбасыңызбен байланыста болыңыз" ru="Оставайтесь на связи с семьёй" en="Stay connected with your family" />
          </p>

          <button
            type="button"
            onClick={google}
            disabled={busy}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground transition hover:border-white/20 disabled:opacity-50"
          >
            <svg width="16" height="16" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            <L kk="Google арқылы кіру" ru="Войти через Google" en="Continue with Google" />
          </button>

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground"><L kk="немесе" ru="или" en="or" /></span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "up" && (
              <div className="grid grid-cols-2 gap-2">
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder={L1({ kk: "Аты", ru: "Имя", en: "First name" })} className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none focus:border-white/20" />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder={L1({ kk: "Тегі", ru: "Фамилия", en: "Last name" })} className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none focus:border-white/20" />
              </div>
            )}
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none focus:border-white/20" />
            <input required type="password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder={L1({ kk: "Құпия сөз (мин. 6)", ru: "Пароль (мин. 6)", en: "Password (min 6)" })} className="w-full rounded-full border border-border bg-surface px-4 py-2 text-sm text-foreground outline-none focus:border-white/20" />
            <button disabled={busy} type="submit" className="w-full rounded-full bg-foreground py-2.5 text-sm font-medium text-background disabled:opacity-50">
              {mode === "in" ? <L kk="Кіру" ru="Войти" en="Sign in" /> : <L kk="Тіркелу" ru="Зарегистрироваться" en="Sign up" />}
            </button>
          </form>

          <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-center text-xs text-muted-foreground hover:text-foreground">
            {mode === "in"
              ? <L kk="Есептік жазба жоқ па? Тіркелу" ru="Нет аккаунта? Зарегистрируйтесь" en="No account? Sign up" />
              : <L kk="Есептік жазба бар ма? Кіру" ru="Есть аккаунт? Войти" en="Have an account? Sign in" />}
          </button>
        </div>
      </div>
    </div>
  );
}

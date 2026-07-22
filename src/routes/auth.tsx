import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Bento, SectionEyebrow } from "@/components/ui-kit";
import { L, useL } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Кіру · SauBol AI" },
      { name: "description", content: "SauBol AI — тіркеліңіз немесе кіріңіз. Email растау міндетті." },
      { property: "og:title", content: "SauBol AI · Кіру" },
      { property: "og:description", content: "SauBol экожүйесіне қауіпсіз кіру." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const L1 = useL();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [role, setRole] = useState<"user" | "parent" | "child">("user");
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      if (s) navigate({ to: "/dashboard" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!username.trim()) { toast.error(L1({ kk: "Username керек", ru: "Нужен username", en: "Username required" })); return; }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { username: username.trim(), role },
          },
        });
        if (error) throw error;
        setSentEmail(email);
        toast.success(L1({ kk: "Растау хаты жіберілді", ru: "Письмо подтверждения отправлено", en: "Verification email sent" }));
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(L1({ kk: "Қош келдіңіз!", ru: "Добро пожаловать!", en: "Welcome!" }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error");
    } finally { setLoading(false); }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error(result.error.message);
  };

  if (sentEmail) return (
    <div className="mx-auto max-w-md pt-16">
      <Bento className="text-center">
        <div className="text-5xl">📧</div>
        <h1 className="mt-4 font-serif text-3xl text-foreground">
          <L kk="Поштаңызды тексеріңіз" ru="Проверьте почту" en="Check your inbox" />
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          <L
            kk={<>Растау сілтемесі <b>{sentEmail}</b> адресіне жіберілді.</>}
            ru={<>Ссылка подтверждения отправлена на <b>{sentEmail}</b>.</>}
            en={<>Verification link sent to <b>{sentEmail}</b>.</>}
          />
        </p>
        <button onClick={() => { setSentEmail(null); setMode("signin"); }} className="mt-6 rounded-full border border-border bg-surface px-5 py-2 text-sm">
          <L kk="Кіру бетіне" ru="К входу" en="Back to sign in" />
        </button>
      </Bento>
    </div>
  );

  return (
    <div className="mx-auto max-w-md pt-12">
      <Bento>
        <SectionEyebrow>SauBol AI · {mode === "signup" ? L1({ kk: "Тіркелу", ru: "Регистрация", en: "Sign up" }) : L1({ kk: "Кіру", ru: "Вход", en: "Sign in" })}</SectionEyebrow>
        <h1 className="mt-1 font-serif text-3xl text-foreground">
          {mode === "signup"
            ? <L kk="Аккаунт құру" ru="Создать аккаунт" en="Create account" />
            : <L kk="Қош келдіңіз" ru="С возвращением" en="Welcome back" />}
        </h1>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "signup" && (
            <>
              <input required minLength={3} value={username} onChange={(e)=>setUsername(e.target.value)} placeholder={L1({kk:"Username",ru:"Username",en:"Username"})} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
              <div className="flex gap-2">
                {(["user","parent","child"] as const).map(r => (
                  <button type="button" key={r} onClick={()=>setRole(r)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs ${role===r?"border-[color:var(--mint)] bg-[color:var(--mint-soft)] text-foreground":"border-border bg-surface text-muted-foreground"}`}>
                    {r === "user" ? L1({kk:"Жеке",ru:"Личный",en:"Personal"}) : r === "parent" ? L1({kk:"Ата-ана",ru:"Родитель",en:"Parent"}) : L1({kk:"Бала",ru:"Ребёнок",en:"Child"})}
                  </button>
                ))}
              </div>
            </>
          )}
          <input required type="email" value={email} onChange={(e)=>setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
          <input required minLength={8} type="password" value={password} onChange={(e)=>setPassword(e.target.value)} placeholder={L1({kk:"Құпиясөз (8+)",ru:"Пароль (8+)",en:"Password (8+)"})} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground" />
          <button disabled={loading} className="w-full rounded-full bg-foreground py-2.5 text-sm font-medium text-background disabled:opacity-50">
            {loading ? "..." : (mode === "signup" ? L1({kk:"Тіркелу",ru:"Зарегистрироваться",en:"Sign up"}) : L1({kk:"Кіру",ru:"Войти",en:"Sign in"}))}
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-[10px] uppercase text-muted-foreground">
          <div className="h-px flex-1 bg-border" /> <L kk="немесе" ru="или" en="or" /> <div className="h-px flex-1 bg-border" />
        </div>
        <button onClick={google} className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface py-2.5 text-sm text-foreground hover:border-white/20">
          <span>G</span> <L kk="Google арқылы" ru="Через Google" en="Continue with Google" />
        </button>

        <div className="mt-5 text-center text-[12px] text-muted-foreground">
          {mode === "signup" ? (
            <>
              <L kk="Аккаунтыңыз бар ма? " ru="Уже есть аккаунт? " en="Have an account? " />
              <button onClick={()=>setMode("signin")} className="text-foreground underline"><L kk="Кіру" ru="Войти" en="Sign in" /></button>
            </>
          ) : (
            <>
              <L kk="Аккаунт жоқ па? " ru="Нет аккаунта? " en="No account? " />
              <button onClick={()=>setMode("signup")} className="text-foreground underline"><L kk="Тіркелу" ru="Регистрация" en="Sign up" /></button>
            </>
          )}
        </div>
        <div className="mt-4 text-center">
          <Link to="/" className="text-[11px] text-muted-foreground hover:text-foreground">← <L kk="Басты бетке" ru="На главную" en="Home" /></Link>
        </div>
      </Bento>
    </div>
  );
}

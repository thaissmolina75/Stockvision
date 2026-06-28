import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Activity, AlertCircle, Eye, EyeOff, Lock, Mail, User2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { PasswordChecklist, isPasswordStrong } from "@/components/password-checklist";
import {
  checkLockout,
  recordFailedAttempt,
  clearAttempts,
  signUpUser,
} from "@/lib/auth.functions";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/inventario" });
  },
  head: () => ({
    meta: [
      { title: "Stock Vision · Iniciar sesión" },
      {
        name: "description",
        content: "Accede a Stock Vision, gestión inteligente de inventario para Pymes.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background">
      <aside className="hidden lg:flex relative flex-col justify-between p-12 text-primary-foreground overflow-hidden bg-gradient-to-br from-primary via-primary to-sidebar-primary">
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="grid place-items-center size-10 rounded-xl bg-white/15 backdrop-blur">
            <Activity className="size-5" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Stock Vision</p>
            <p className="text-[11px] opacity-70">Inventario Inteligente</p>
          </div>
        </div>
        <div className="relative z-10 space-y-4 max-w-md">
          <h2 className="text-4xl font-semibold tracking-tight leading-tight">
            Decisiones de inventario con datos, no con intuición.
          </h2>
          <p className="text-sm opacity-80">
            Predicción de demanda, alertas de stock crítico y reportes ejecutivos en una sola
            aplicación de escritorio para tu Pyme.
          </p>
          <ul className="text-sm space-y-2 pt-4 opacity-90">
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-success" /> Modelo LightGBM con métricas profesionales</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-success" /> Alertas críticas y de sobrestock automáticas</li>
            <li className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-success" /> Roles Administrador y Operador con permisos</li>
          </ul>
        </div>
        <p className="relative z-10 text-[11px] opacity-60">© Stock Vision · Edición Pyme</p>
        <div className="pointer-events-none absolute -bottom-32 -right-32 size-[420px] rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-20 -left-20 size-[280px] rounded-full bg-success/20 blur-3xl" />
      </aside>

      <main className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-6 flex items-center gap-2">
            <div className="grid place-items-center size-9 rounded-lg bg-primary text-primary-foreground">
              <Activity className="size-5" />
            </div>
            <p className="font-semibold">Stock Vision</p>
          </div>

          <Tabs defaultValue="login">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
              <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <SignUpForm />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      <AlertCircle className="size-4 mt-0.5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}

function LoginForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const checkLock = useServerFn(checkLockout);
  const record = useServerFn(recordFailedAttempt);
  const clear = useServerFn(clearAttempts);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Ingresa tu correo y contraseña.");
      return;
    }
    setLoading(true);
    try {
      const lock = await checkLock({ data: { email } });
      if (lock.locked) {
        setError(
          `Cuenta bloqueada por demasiados intentos fallidos. Intenta nuevamente en ${lock.minutesLeft} minuto${lock.minutesLeft === 1 ? "" : "s"}.`,
        );
        return;
      }
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signErr) {
        const rec = await record({ data: { email } });
        if (rec.locked) {
          setError(
            `Has superado los 5 intentos fallidos. La cuenta queda bloqueada por ${rec.lockMinutes} minutos.`,
          );
        } else {
          setError(
            `Credenciales inválidas. Te quedan ${rec.attemptsLeft} intento${rec.attemptsLeft === 1 ? "" : "s"} antes del bloqueo.`,
          );
        }
        return;
      }
      await clear({ data: { email } });
      await qc.invalidateQueries();
      toast.success("Bienvenido a Stock Vision");
      navigate({ to: "/inventario" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible iniciar sesión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Iniciar sesión</h1>
        <p className="text-sm text-muted-foreground mt-1">Accede con tu cuenta corporativa.</p>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="space-y-2">
        <label className="text-sm font-medium">Correo electrónico</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="email"
            autoComplete="email"
            placeholder="tu@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9 h-10"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9 pr-10 h-10"
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
            aria-label={show ? "Ocultar" : "Mostrar"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </div>
      <Button type="submit" className="w-full h-10" disabled={loading}>
        {loading ? "Verificando…" : "Iniciar sesión"}
      </Button>
      <p className="text-[11px] text-muted-foreground text-center">
        Las contraseñas se almacenan cifradas con bcrypt. Tras 5 intentos fallidos, la cuenta se bloquea 15 minutos.
      </p>
    </form>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signUp = useServerFn(signUpUser);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError("Ingresa tu nombre completo.");
      return;
    }
    if (!isPasswordStrong(password)) {
      setError("La contraseña no cumple todos los requisitos de seguridad.");
      return;
    }
    setLoading(true);
    try {
      await signUp({ data: { email, password, fullName } });
      const { error: signErr } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });
      if (signErr) throw new Error(signErr.message);
      await qc.invalidateQueries();
      toast.success("Cuenta creada", { description: "Bienvenido a Stock Vision" });
      navigate({ to: "/inventario" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No fue posible crear la cuenta.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Las cuentas nuevas se crean con rol <span className="font-medium">Operador</span>. Un Administrador puede elevarlas más tarde.
        </p>
      </div>
      {error && <ErrorBanner message={error} />}
      <div className="space-y-2">
        <label className="text-sm font-medium">Nombre completo</label>
        <div className="relative">
          <User2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Juana Méndez"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="pl-9 h-10"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Correo electrónico</label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type="email"
            autoComplete="email"
            placeholder="tu@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="pl-9 h-10"
            required
          />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-sm font-medium">Contraseña</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-9 pr-10 h-10"
            required
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground"
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        <div className="rounded-lg border border-border bg-secondary/40 p-3">
          <PasswordChecklist password={password} />
        </div>
      </div>
      <Button type="submit" className="w-full h-10" disabled={loading || !isPasswordStrong(password)}>
        {loading ? "Creando cuenta…" : "Crear cuenta"}
      </Button>
    </form>
  );
}

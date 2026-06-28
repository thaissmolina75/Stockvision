import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

export const checkLockout = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => ({
    email: String(input.email || "").trim().toLowerCase(),
  }))
  .handler(async ({ data }) => {
    if (!data.email) return { locked: false as const };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("auth_attempts" as never)
      .select("locked_until,failed_count")
      .eq("email", data.email)
      .maybeSingle();
    const r = row as { locked_until: string | null; failed_count: number } | null;
    if (r?.locked_until) {
      const until = new Date(r.locked_until).getTime();
      if (until > Date.now()) {
        return {
          locked: true as const,
          minutesLeft: Math.max(1, Math.ceil((until - Date.now()) / 60000)),
        };
      }
    }
    return { locked: false as const, failedCount: r?.failed_count ?? 0 };
  });

export const recordFailedAttempt = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => ({
    email: String(input.email || "").trim().toLowerCase(),
  }))
  .handler(async ({ data }) => {
    if (!data.email) return { locked: false as const, attemptsLeft: MAX_ATTEMPTS };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const admin = supabaseAdmin as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (k: string, v: string) => {
            maybeSingle: () => Promise<{ data: { failed_count: number } | null }>;
          };
        };
        upsert: (
          v: Record<string, unknown>,
          o?: { onConflict?: string },
        ) => Promise<{ error: unknown }>;
      };
    };
    const { data: existing } = await admin
      .from("auth_attempts")
      .select("failed_count")
      .eq("email", data.email)
      .maybeSingle();
    const newCount = (existing?.failed_count ?? 0) + 1;
    const locked = newCount >= MAX_ATTEMPTS;
    await admin.from("auth_attempts").upsert(
      {
        email: data.email,
        failed_count: newCount,
        last_attempt: new Date().toISOString(),
        locked_until: locked
          ? new Date(Date.now() + LOCK_MINUTES * 60_000).toISOString()
          : null,
      },
      { onConflict: "email" },
    );
    return {
      locked,
      attemptsLeft: Math.max(0, MAX_ATTEMPTS - newCount),
      lockMinutes: LOCK_MINUTES,
    };
  });

export const clearAttempts = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => ({
    email: String(input.email || "").trim().toLowerCase(),
  }))
  .handler(async ({ data }) => {
    if (!data.email) return { ok: true };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await (supabaseAdmin as unknown as {
      from: (t: string) => { delete: () => { eq: (k: string, v: string) => Promise<unknown> } };
    })
      .from("auth_attempts")
      .delete()
      .eq("email", data.email);
    return { ok: true };
  });

export const signUpUser = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string; fullName: string }) => ({
    email: String(input.email || "").trim().toLowerCase(),
    password: String(input.password || ""),
    fullName: String(input.fullName || "").trim().slice(0, 120),
  }))
  .handler(async ({ data }) => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      throw new Error("Correo electrónico inválido.");
    }
    if (
      data.password.length < 8 ||
      !/[A-Z]/.test(data.password) ||
      !/[a-z]/.test(data.password) ||
      !/[0-9]/.test(data.password) ||
      !/[^A-Za-z0-9]/.test(data.password)
    ) {
      throw new Error("La contraseña no cumple los requisitos de seguridad.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.fullName },
    });
    if (error) {
      if (/already|exists|registered/i.test(error.message)) {
        throw new Error("Ya existe una cuenta con ese correo.");
      }
      throw new Error(error.message);
    }
    return { ok: true, userId: created.user?.id };
  });

export const getMe = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabase = context.supabase as unknown as {
      from: (t: string) => {
        select: (c: string) => {
          eq: (k: string, v: string) => {
            maybeSingle: () => Promise<{ data: Record<string, unknown> | null }>;
          };
        };
      };
    };
    const [{ data: profile }, { data: roleRow }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,email").eq("id", context.userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", context.userId).maybeSingle(),
    ]);
    return {
      userId: context.userId,
      fullName: (profile?.full_name as string) ?? "",
      email: (profile?.email as string) ?? "",
      role: ((roleRow?.role as string) ?? "operador") as "administrador" | "operador",
    };
  });

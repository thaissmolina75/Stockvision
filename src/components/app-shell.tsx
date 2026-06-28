import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Boxes, Upload, BrainCircuit, FileBarChart, Database, Activity, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/user-menu";
import { useCurrentUser, type AppRole } from "@/lib/use-current-user";

const NAV: ReadonlyArray<{
  to: "/inventario" | "/carga" | "/predictivo" | "/reportes";
  label: string;
  icon: typeof Boxes;
  roles: AppRole[];
  role: string;
}> = [
  { to: "/inventario", label: "Inventario y Alertas", icon: Boxes, roles: ["administrador", "operador"], role: "Administrador · Operador" },
  { to: "/carga", label: "Carga de Datos", icon: Upload, roles: ["administrador"], role: "Solo Administrador" },
  { to: "/predictivo", label: "Módulo Predictivo", icon: BrainCircuit, roles: ["administrador"], role: "Solo Administrador" },
  { to: "/reportes", label: "Reportes", icon: FileBarChart, roles: ["administrador"], role: "Solo Administrador" },
];

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/inventario": { title: "Inventario y Alertas", subtitle: "Niveles de stock y alertas activas" },
  "/carga": { title: "Carga de Datos", subtitle: "Importación de ventas históricas" },
  "/predictivo": { title: "Módulo Predictivo / Analítico", subtitle: "Entrenamiento y proyección de demanda" },
  "/reportes": { title: "Reportes Ejecutivos", subtitle: "KPIs y exportación" },
};

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const header = TITLES[path] ?? { title: "Stock Vision", subtitle: "" };
  const { data: me } = useCurrentUser();
  const role = me?.role;

  const visibleNav = NAV.filter((n) => !role || n.roles.includes(role));

  return (
    <div className="flex min-h-screen w-full bg-background">
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="flex items-center gap-2 px-5 py-5 border-b border-sidebar-border">
          <div className="grid place-items-center size-9 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
            <Activity className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Stock Vision</p>
            <p className="text-[11px] text-sidebar-foreground/60">Inventario Inteligente</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {visibleNav.map((item) => {
            const active = path.startsWith(item.to);
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="truncate">{item.label}</div>
                  <div className="text-[10px] uppercase tracking-wider text-sidebar-foreground/45">
                    {item.role}
                  </div>
                </div>
              </Link>
            );
          })}
          {role === "operador" && (
            <div className="mt-4 mx-2 rounded-lg border border-dashed border-sidebar-border/60 p-3 text-[11px] text-sidebar-foreground/55">
              <div className="flex items-center gap-1.5 font-medium text-sidebar-foreground/70 mb-1">
                <Lock className="size-3" /> Acceso de Operador
              </div>
              Módulos de análisis, carga y reportes están restringidos al rol Administrador.
            </div>
          )}
        </nav>

        <div className="m-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
          <div className="flex items-center gap-2 text-xs">
            <Database className="size-3.5 text-sidebar-primary" />
            <span className="font-medium">Local · SQLite</span>
          </div>
          <p className="text-[11px] text-sidebar-foreground/60 mt-1">Modo escritorio · 1 usuario activo</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">{header.title}</h1>
            <p className="text-xs text-muted-foreground">{header.subtitle}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs text-muted-foreground">
              <span className="size-2 rounded-full bg-success animate-pulse" />
              Servicio local activo
            </div>
            <UserMenu />
          </div>
        </header>

        <main className="flex-1 overflow-auto">
          <div className="p-6 max-w-[1400px] mx-auto animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export function RequireRole({
  role,
  children,
}: {
  role: AppRole;
  children: ReactNode;
}) {
  const { data: me, isLoading } = useCurrentUser();
  if (isLoading) {
    return (
      <div className="grid place-items-center min-h-[60vh] text-sm text-muted-foreground">
        Verificando permisos…
      </div>
    );
  }
  if (!me || me.role !== role) {
    return (
      <div className="max-w-lg mx-auto mt-12 rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
        <Lock className="size-8 mx-auto text-destructive mb-3" />
        <h2 className="text-lg font-semibold text-foreground">Acceso restringido</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Esta sección requiere el rol <span className="font-medium text-foreground">{role}</span>.
          Tu rol actual ({me?.role ?? "desconocido"}) no tiene acceso.
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

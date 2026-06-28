import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, ShieldCheck, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser, type AppRole } from "@/lib/use-current-user";

function initials(name: string, email: string) {
  const src = (name || email || "?").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function RoleBadge({ role }: { role: AppRole }) {
  const isAdmin = role === "administrador";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
        isAdmin ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
      }`}
    >
      <ShieldCheck className="size-3" />
      {isAdmin ? "Administrador" : "Operador"}
    </span>
  );
}

export function UserMenu() {
  const { data: me } = useCurrentUser();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const handleSignOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  if (!me) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary animate-pulse">
        <div className="size-6 rounded-full bg-muted" />
        <div className="h-3 w-16 bg-muted rounded" />
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-full bg-secondary hover:bg-secondary/70 transition-colors">
          <div className="size-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-semibold">
            {initials(me.fullName, me.email)}
          </div>
          <div className="hidden sm:flex flex-col items-start leading-tight">
            <span className="text-xs font-medium text-foreground">
              {me.fullName || me.email.split("@")[0]}
            </span>
            <RoleBadge role={me.role} />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="flex flex-col gap-1">
          <span className="text-sm font-semibold">
            {me.fullName || "Usuario"}
          </span>
          <span className="text-xs text-muted-foreground font-normal truncate">
            {me.email}
          </span>
          <div className="pt-1">
            <RoleBadge role={me.role} />
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-xs text-muted-foreground">
          <User className="size-4 mr-2" />
          Mi cuenta
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleSignOut}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="size-4 mr-2" />
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

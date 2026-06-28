import { Check, X } from "lucide-react";

export const PASSWORD_RULES = [
  { key: "len", label: "Mínimo 8 caracteres", test: (p: string) => p.length >= 8 },
  { key: "upper", label: "Una letra mayúscula", test: (p: string) => /[A-Z]/.test(p) },
  { key: "lower", label: "Una letra minúscula", test: (p: string) => /[a-z]/.test(p) },
  { key: "num", label: "Un número", test: (p: string) => /[0-9]/.test(p) },
  { key: "spec", label: "Un carácter especial (!@#$…)", test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const;

export function isPasswordStrong(p: string) {
  return PASSWORD_RULES.every((r) => r.test(p));
}

export function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="grid grid-cols-1 gap-1.5 text-xs">
      {PASSWORD_RULES.map((r) => {
        const ok = r.test(password);
        return (
          <li
            key={r.key}
            className={`flex items-center gap-2 transition-colors ${
              ok ? "text-success" : "text-muted-foreground"
            }`}
          >
            <span
              className={`grid place-items-center size-4 rounded-full transition-colors ${
                ok ? "bg-success/15" : "bg-muted"
              }`}
            >
              {ok ? <Check className="size-3" /> : <X className="size-3 opacity-50" />}
            </span>
            {r.label}
          </li>
        );
      })}
    </ul>
  );
}

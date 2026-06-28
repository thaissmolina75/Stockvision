import { cn } from "@/lib/utils";
import type { Status } from "@/lib/inventory-store";

const styles: Record<Status, string> = {
  CRITICO: "bg-destructive/10 text-destructive border-destructive/30",
  SOBRESTOCK: "bg-warning/15 text-warning-foreground border-warning/40",
  NORMAL: "bg-success/10 text-success border-success/30",
};

const labels: Record<Status, string> = {
  CRITICO: "CRÍTICO",
  SOBRESTOCK: "SOBRESTOCK",
  NORMAL: "NORMAL",
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide",
        styles[status],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {labels[status]}
    </span>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { AppShell, RequireRole } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/status-badge";
import { useInventory, getStatus } from "@/lib/inventory-store";
import { AlertTriangle, Repeat, Target, FileDown, FileText, TrendingUp, TrendingDown } from "lucide-react";

export const Route = createFileRoute("/_authenticated/reportes")({
  head: () => ({
    meta: [
      { title: "Reportes · Stock Vision" },
      { name: "description", content: "KPIs ejecutivos y exportación de reportes en PDF/CSV." },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireRole role="administrador">
        <ReportesPage />
      </RequireRole>
    </AppShell>
  ),
});

function ReportesPage() {
  const { products } = useInventory();
  const alerts = products.filter((p) => getStatus(p) !== "NORMAL");
  const critical = products.filter((p) => getStatus(p) === "CRITICO");

  const kpis = [
    {
      label: "Productos en Alerta", value: alerts.length, delta: "+2 vs mes ant.", down: true,
      Icon: AlertTriangle, tone: "text-destructive bg-destructive/10",
    },
    {
      label: "Índice de Rotación Simulado", value: "4.7×", delta: "+0.4 vs mes ant.", down: false,
      Icon: Repeat, tone: "text-primary bg-primary/10",
    },
    {
      label: "Precisión Promedio del Mes", value: "91.6%", delta: "+1.8 pts", down: false,
      Icon: Target, tone: "text-success bg-success/10",
    },
  ];

  const exportar = (fmt: "PDF" | "CSV") =>
    toast.success(`Reporte ${fmt} generado correctamente`, {
      description: `stock-vision-${new Date().toISOString().slice(0, 10)}.${fmt.toLowerCase()}`,
    });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <span className={`grid place-items-center size-9 rounded-lg ${k.tone}`}>
                <k.Icon className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{k.value}</p>
            <p className={`mt-1 inline-flex items-center gap-1 text-xs ${k.down ? "text-destructive" : "text-success"}`}>
              {k.down ? <TrendingDown className="size-3.5" /> : <TrendingUp className="size-3.5" />}
              {k.delta}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">Exportar reportes</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Genera un informe consolidado con KPIs, alertas y predicciones del período actual.
          </p>
          <div className="mt-5 space-y-2">
            <Button onClick={() => exportar("PDF")} variant="outline" className="w-full justify-start" size="lg">
              <FileText className="size-4" /> Exportar a PDF
            </Button>
            <Button onClick={() => exportar("CSV")} className="w-full justify-start bg-success text-success-foreground hover:bg-success/90" size="lg">
              <FileDown className="size-4" /> Exportar a CSV
            </Button>
          </div>
          <div className="mt-5 pt-5 border-t border-border text-xs text-muted-foreground space-y-1">
            <p>Última exportación: <span className="text-foreground font-medium">hace 3 horas</span></p>
            <p>Almacenado en: <span className="font-mono">~/StockVision/exports/</span></p>
          </div>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Últimas alertas críticas</h2>
              <p className="text-xs text-muted-foreground">Productos por debajo de stock mínimo</p>
            </div>
            <span className="text-xs text-muted-foreground">{critical.length} ítems</span>
          </div>
          <ul className="divide-y divide-border">
            {critical.slice(0, 5).map((p) => (
              <li key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-secondary/30 transition-colors">
                <div>
                  <p className="font-medium text-sm">{p.description}</p>
                  <p className="text-xs text-muted-foreground font-mono">{p.id}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Stock / Min</p>
                    <p className="text-sm tabular-nums font-medium">{p.stock} / {p.minStock}</p>
                  </div>
                  <StatusBadge status={getStatus(p)} />
                </div>
              </li>
            ))}
            {critical.length === 0 && (
              <li className="px-5 py-10 text-center text-sm text-muted-foreground">
                No hay alertas críticas en este momento.
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

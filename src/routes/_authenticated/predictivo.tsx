import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell, RequireRole } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BrainCircuit, Loader2, ArrowUp, ArrowDown, Minus, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/predictivo")({
  head: () => ({
    meta: [
      { title: "Módulo Predictivo · Stock Vision" },
      { name: "description", content: "Predicción de demanda con LightGBM y métricas avanzadas." },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireRole role="administrador">
        <PredictivoPage />
      </RequireRole>
    </AppShell>
  ),
});

const PREDICTED = [
  "Harina PAN 1kg", "Arroz Diana 500g", "Aceite Girasol 1L", "Leche entera 1L",
  "Azúcar refinada 1kg", "Pasta espagueti 500g", "Café molido 250g", "Atún en lata 170g",
  "Frijol negro 500g", "Salsa de tomate 400g",
];
const REAL = [
  "Aceite Girasol 1L", "Harina PAN 1kg", "Leche entera 1L", "Arroz Diana 500g",
  "Café molido 250g", "Azúcar refinada 1kg", "Atún en lata 170g", "Pasta espagueti 500g",
  "Mayonesa 500g", "Frijol negro 500g",
];

const METRICS = [
  { label: "Mean Absolute Error (MAE)", value: "8.42%", tag: "MODELO ACEPTABLE <15%", tone: "success" as const },
  { label: "Root Mean Squared Error (RMSE)", value: "11.15%", tag: "Dispersión baja", tone: "neutral" as const },
  { label: "Coeficiente de Determinación (R²)", value: "0.89", tag: "Alta correlación", tone: "success" as const },
  { label: "Correlación de Spearman", value: "0.812", tag: "Ranking confiable", tone: "neutral" as const },
];

function PredictivoPage() {
  const [horizon, setHorizon] = useState("mensual");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const run = () => {
    setLoading(true); setDone(false);
    setTimeout(() => { setLoading(false); setDone(true); }, 1800);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="grid place-items-center size-9 rounded-lg bg-primary/10 text-primary">
              <BrainCircuit className="size-4" />
            </span>
            <div>
              <h2 className="font-semibold leading-none">Configuración del modelo</h2>
              <p className="text-xs text-muted-foreground mt-1">LightGBM · Backend Python</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <Label className="text-sm">Horizonte temporal</Label>
            <RadioGroup value={horizon} onValueChange={setHorizon} className="space-y-2">
              {[
                { v: "mensual", l: "Próximo Período Mensual", d: "Predicción agregada a 30 días" },
                { v: "semanal", l: "Próxima Semana", d: "Granularidad de 7 días" },
              ].map((o) => (
                <label
                  key={o.v}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors",
                    horizon === o.v ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/40",
                  )}
                >
                  <RadioGroupItem value={o.v} className="mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">{o.l}</p>
                    <p className="text-xs text-muted-foreground">{o.d}</p>
                  </div>
                </label>
              ))}
            </RadioGroup>
          </div>

          <Button onClick={run} disabled={loading} className="w-full mt-6" size="lg">
            {loading ? (<><Loader2 className="size-4 animate-spin" /> Entrenando modelo…</>) :
              "ENTRENAR ALGORITMO Y GENERAR PROYECCIÓN"}
          </Button>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold">Métricas del modelo</h2>
              <p className="text-xs text-muted-foreground">
                {done ? "Última ejecución: hace unos segundos" : "Ejecuta el entrenamiento para ver resultados"}
              </p>
            </div>
            {done && (
              <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                <CheckCircle2 className="size-3.5" /> Modelo entrenado
              </span>
            )}
          </div>

          <div className={cn("mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3", !done && "opacity-40")}>
            {METRICS.map((m) => (
              <div key={m.label} className="rounded-lg border border-border bg-secondary/30 p-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-3xl font-semibold tracking-tight mt-1 tabular-nums">{m.value}</p>
                <span className={cn(
                  "inline-block mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border",
                  m.tone === "success"
                    ? "bg-success/10 text-success border-success/30"
                    : "bg-secondary text-muted-foreground border-border",
                )}>
                  {m.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold">Recomendaciones Predictivas de Compra · Top 10 Líderes</h2>
          <p className="text-xs text-muted-foreground">
            Comparación entre el ordenamiento predicho por el algoritmo y las ventas reales observadas.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border">
          <RankTable title="Top 10 Productos Predichos" items={PREDICTED} compare={REAL} />
          <RankTable title="Top 10 Ventas Reales" items={REAL} compare={PREDICTED} hideDelta />
        </div>
      </div>
    </div>
  );
}

function RankTable({ title, items, compare, hideDelta = false }: {
  title: string; items: string[]; compare: string[]; hideDelta?: boolean;
}) {
  return (
    <div>
      <div className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</div>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-10">#</TableHead>
            <TableHead>Producto</TableHead>
            {!hideDelta && <TableHead className="text-right w-20">Δ Rank</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((name, i) => {
            const otherIdx = compare.indexOf(name);
            const delta = otherIdx === -1 ? null : otherIdx - i;
            return (
              <TableRow key={name}>
                <TableCell className="font-mono text-xs text-muted-foreground">{String(i + 1).padStart(2, "0")}</TableCell>
                <TableCell className="font-medium">{name}</TableCell>
                {!hideDelta && (
                  <TableCell className="text-right">
                    {delta === null ? (
                      <span className="text-xs text-muted-foreground">—</span>
                    ) : delta === 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Minus className="size-3" />0</span>
                    ) : delta > 0 ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success font-medium"><ArrowUp className="size-3" />{delta}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-destructive font-medium"><ArrowDown className="size-3" />{Math.abs(delta)}</span>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

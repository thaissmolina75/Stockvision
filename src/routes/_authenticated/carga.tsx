import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell, RequireRole } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadCloud, FileSpreadsheet, Loader2, CheckCircle2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/carga")({
  head: () => ({
    meta: [
      { title: "Carga de Datos · Stock Vision" },
      { name: "description", content: "Importa históricos de ventas en CSV con validación automática." },
    ],
  }),
  component: () => (
    <AppShell>
      <RequireRole role="administrador">
        <CargaPage />
      </RequireRole>
    </AppShell>
  ),
});

const LOGS = [
  "[INIT] Iniciando proceso de ingesta de datos…",
  "[VALIDACIÓN] Éxito: Archivo cargado con codificación ISO-8859-1 de forma correcta.",
  "[PARSER] Detectados 12,450 registros válidos · 0 inconsistencias.",
  "[BASE DATOS] Éxito: 12,450 registros ordenados por fecha y persistidos en la base de datos local SQLite.",
  "[OK] Proceso finalizado en 1.42s.",
];

const PREVIEW = [
  { code: "S10_1678", date: "2024-11-03", sales: 2541.55, qty: 35 },
  { code: "S10_1949", date: "2024-11-03", sales: 4117.21, qty: 48 },
  { code: "S12_2823", date: "2024-11-04", sales: 1894.30, qty: 22 },
  { code: "S18_3232", date: "2024-11-04", sales: 3208.74, qty: 41 },
  { code: "S24_4258", date: "2024-11-05", sales: 1675.90, qty: 19 },
];

function CargaPage() {
  const [file, setFile] = useState<{ name: string; size: string } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    consoleRef.current?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [visibleLogs]);

  const pick = (f: File) => {
    const kb = (f.size / 1024).toFixed(1);
    setFile({ name: f.name, size: `${kb} KB` });
    setVisibleLogs([]);
  };

  const run = () => {
    setLoading(true);
    setVisibleLogs([]);
    let i = 0;
    const next = () => {
      if (i >= LOGS.length) { setLoading(false); return; }
      setVisibleLogs((v) => [...v, LOGS[i]]);
      i++;
      setTimeout(next, 320);
    };
    setTimeout(next, 400);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-semibold">Importar archivo de ventas</h2>
          <p className="text-sm text-muted-foreground">
            Formatos aceptados: <span className="font-mono">.csv</span> (ISO-8859-1 / UTF-8).
          </p>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragging(false);
              const f = e.dataTransfer.files?.[0]; if (f) pick(f);
            }}
            onClick={() => inputRef.current?.click()}
            className={cn(
              "mt-5 cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors",
              dragging ? "border-primary bg-primary/5" : "border-border bg-secondary/30 hover:bg-secondary/60",
            )}
          >
            <input
              ref={inputRef} type="file" accept=".csv" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) pick(f); }}
            />
            <UploadCloud className="size-10 mx-auto text-muted-foreground" />
            <p className="mt-3 font-medium">Arrastra <span className="font-mono">sales_data_sample.csv</span> aquí</p>
            <p className="text-sm text-muted-foreground">o haz clic para explorar archivos locales</p>
          </div>

          {file && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-4 py-3">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="size-5 text-primary" />
                <div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.size} · listo para validar</p>
                </div>
              </div>
              <button onClick={() => { setFile(null); setVisibleLogs([]); }} className="text-muted-foreground hover:text-foreground">
                <X className="size-4" />
              </button>
            </div>
          )}

          <Button onClick={run} disabled={!file || loading} className="w-full mt-5" size="lg">
            {loading ? (<><Loader2 className="size-4 animate-spin" /> Procesando…</>) : "Ejecutar Validación y Carga"}
          </Button>
        </div>

        <div className="lg:col-span-2 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Consola del sistema</p>
              <p className="text-xs text-muted-foreground">Log de ingesta en vivo</p>
            </div>
            {visibleLogs.length === LOGS.length && (
              <span className="inline-flex items-center gap-1 text-xs text-success font-medium">
                <CheckCircle2 className="size-3.5" /> Completado
              </span>
            )}
          </div>
          <div
            ref={consoleRef}
            className="flex-1 min-h-[280px] bg-[oklch(0.18_0.04_265)] text-emerald-300 font-mono text-xs p-4 overflow-auto"
          >
            {visibleLogs.length === 0 && (
              <p className="text-slate-500">$ esperando archivo…</p>
            )}
            {visibleLogs.map((l, i) => (
              <p key={i} className="animate-in fade-in slide-in-from-left-1 duration-200">
                <span className="text-slate-500 mr-2">›</span>{l}
              </p>
            ))}
            {loading && visibleLogs.length < LOGS.length && (
              <span className="inline-block w-2 h-3 bg-emerald-300 animate-pulse" />
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-sm font-semibold">Preview · primeras 5 filas</p>
          <p className="text-xs text-muted-foreground">Vista de muestra del dataset cargado</p>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>PRODUCTCODE</TableHead>
              <TableHead>ORDERDATE</TableHead>
              <TableHead className="text-right">SALES</TableHead>
              <TableHead className="text-right">QUANTITYORDERED</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {PREVIEW.map((r) => (
              <TableRow key={r.code + r.date}>
                <TableCell className="font-mono text-xs">{r.code}</TableCell>
                <TableCell className="text-muted-foreground">{r.date}</TableCell>
                <TableCell className="text-right tabular-nums">${r.sales.toFixed(2)}</TableCell>
                <TableCell className="text-right tabular-nums">{r.qty}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

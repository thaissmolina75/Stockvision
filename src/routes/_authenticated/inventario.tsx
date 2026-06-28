import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useInventory, getStatus, type Product, type Status } from "@/lib/inventory-store";
import { useCurrentUser } from "@/lib/use-current-user";
import { AlertTriangle, PackageCheck, TrendingUp, Search } from "lucide-react";

export const Route = createFileRoute("/_authenticated/inventario")({
  head: () => ({
    meta: [
      { title: "Inventario y Alertas · Stock Vision" },
      { name: "description", content: "Monitoreo de stock crítico y sobrestock en tiempo real." },
    ],
  }),
  component: () => (
    <AppShell>
      <InventarioPage />
    </AppShell>
  ),
});

function InventarioPage() {
  const { products, updateMinStock } = useInventory();
  const { data: me } = useCurrentUser();
  const canEdit = me?.role === "administrador";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Status | "ALL">("ALL");
  const [selected, setSelected] = useState<Product | null>(null);
  const [draft, setDraft] = useState<number>(0);

  const counts = useMemo(() => {
    const c = { CRITICO: 0, SOBRESTOCK: 0, NORMAL: 0 } as Record<Status, number>;
    products.forEach((p) => c[getStatus(p)]++);
    return c;
  }, [products]);

  const rows = products.filter((p) => {
    const matchesQ =
      !query ||
      p.description.toLowerCase().includes(query.toLowerCase()) ||
      p.id.toLowerCase().includes(query.toLowerCase());
    const matchesF = filter === "ALL" || getStatus(p) === filter;
    return matchesQ && matchesF;
  });

  const cards = [
    { label: "Productos Críticos", value: counts.CRITICO, Icon: AlertTriangle, tone: "text-destructive bg-destructive/10" },
    { label: "Sobrestock", value: counts.SOBRESTOCK, Icon: TrendingUp, tone: "text-warning-foreground bg-warning/15" },
    { label: "En Niveles Normales", value: counts.NORMAL, Icon: PackageCheck, tone: "text-success bg-success/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{c.label}</p>
              <span className={`grid place-items-center size-9 rounded-lg ${c.tone}`}>
                <c.Icon className="size-4" />
              </span>
            </div>
            <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between p-4 border-b border-border">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por ID o descripción…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-1 p-1 bg-secondary rounded-lg">
            {(["ALL", "CRITICO", "SOBRESTOCK", "NORMAL"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 text-xs rounded-md transition-colors ${
                  filter === f
                    ? "bg-card text-foreground shadow-sm font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f === "ALL" ? "Todos" : f === "CRITICO" ? "Críticos" : f === "SOBRESTOCK" ? "Sobrestock" : "Normales"}
              </button>
            ))}
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-32">ID Producto</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="text-right">Stock Actual</TableHead>
              <TableHead className="text-right">Stock Mínimo</TableHead>
              <TableHead className="text-right">Demanda Proy.</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-24"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id} className="group">
                <TableCell className="font-mono text-xs text-muted-foreground">{p.id}</TableCell>
                <TableCell className="font-medium">{p.description}</TableCell>
                <TableCell className="text-right tabular-nums">{p.stock}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{p.minStock}</TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">{p.projected}</TableCell>
                <TableCell><StatusBadge status={getStatus(p)} /></TableCell>
                <TableCell className="text-right">
                  {canEdit ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelected(p); setDraft(p.minStock); }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      Editar
                    </Button>
                  ) : (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Solo lectura
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-12">Sin resultados</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Editar Stock Mínimo</SheetTitle>
            <SheetDescription>
              Ajusta el umbral mínimo del producto seleccionado. La alerta se recalcula al guardar.
            </SheetDescription>
          </SheetHeader>
          {selected && (
            <div className="px-4 space-y-5">
              <div className="rounded-lg border border-border bg-secondary/40 p-4">
                <p className="text-xs text-muted-foreground font-mono">{selected.id}</p>
                <p className="font-semibold mt-1">{selected.description}</p>
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Stock</p>
                    <p className="font-semibold tabular-nums">{selected.stock}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Mínimo</p>
                    <p className="font-semibold tabular-nums">{selected.minStock}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">Proyec.</p>
                    <p className="font-semibold tabular-nums">{selected.projected}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nuevo Stock Mínimo</label>
                <Input
                  type="number"
                  min={0}
                  value={draft}
                  onChange={(e) => setDraft(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Estado simulado: <StatusBadge status={getStatus({ ...selected, minStock: draft })} />
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setSelected(null)}>
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    updateMinStock(selected.id, draft);
                    toast.success("Stock mínimo actualizado", {
                      description: `${selected.description} → mínimo ${draft}`,
                    });
                    setSelected(null);
                  }}
                >
                  Guardar
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

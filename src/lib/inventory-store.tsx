import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type Product = {
  id: string;
  description: string;
  stock: number;
  minStock: number;
  projected: number;
};

export type Status = "CRITICO" | "SOBRESTOCK" | "NORMAL";

export function getStatus(p: Product): Status {
  if (p.stock < p.minStock) return "CRITICO";
  if (p.stock > p.projected * 2) return "SOBRESTOCK";
  return "NORMAL";
}

const SEED: Product[] = [
  { id: "SKU-1001", description: "Harina PAN 1kg", stock: 18, minStock: 40, projected: 60 },
  { id: "SKU-1002", description: "Aceite Girasol 1L", stock: 220, minStock: 50, projected: 80 },
  { id: "SKU-1003", description: "Leche entera 1L", stock: 95, minStock: 80, projected: 90 },
  { id: "SKU-1004", description: "Arroz Diana 500g", stock: 12, minStock: 60, projected: 70 },
  { id: "SKU-1005", description: "Atún en lata 170g", stock: 140, minStock: 50, projected: 55 },
  { id: "SKU-1006", description: "Azúcar refinada 1kg", stock: 78, minStock: 40, projected: 65 },
  { id: "SKU-1007", description: "Café molido 250g", stock: 45, minStock: 30, projected: 50 },
  { id: "SKU-1008", description: "Pasta espagueti 500g", stock: 9, minStock: 35, projected: 40 },
  { id: "SKU-1009", description: "Mantequilla 250g", stock: 180, minStock: 25, projected: 35 },
  { id: "SKU-1010", description: "Avena en hojuelas 400g", stock: 52, minStock: 30, projected: 45 },
  { id: "SKU-1011", description: "Sal marina 1kg", stock: 33, minStock: 20, projected: 25 },
  { id: "SKU-1012", description: "Frijol negro 500g", stock: 6, minStock: 30, projected: 38 },
  { id: "SKU-1013", description: "Maíz precocido 1kg", stock: 70, minStock: 40, projected: 55 },
  { id: "SKU-1014", description: "Mayonesa 500g", stock: 200, minStock: 25, projected: 30 },
  { id: "SKU-1015", description: "Salsa de tomate 400g", stock: 41, minStock: 30, projected: 42 },
];

type Ctx = {
  products: Product[];
  updateMinStock: (id: string, value: number) => void;
};

const InventoryCtx = createContext<Ctx | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [products, setProducts] = useState<Product[]>(SEED);
  const value = useMemo<Ctx>(
    () => ({
      products,
      updateMinStock: (id, value) =>
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, minStock: value } : p))),
    }),
    [products],
  );
  return <InventoryCtx.Provider value={value}>{children}</InventoryCtx.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryCtx);
  if (!ctx) throw new Error("useInventory must be inside InventoryProvider");
  return ctx;
}

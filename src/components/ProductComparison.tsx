import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { X, GitCompareArrows } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";

interface CompareCtx {
  items: string[];
  addItem: (id: string) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  isInCompare: (id: string) => boolean;
}

const CompareContext = createContext<CompareCtx>({
  items: [], addItem: () => {}, removeItem: () => {}, clearAll: () => {}, isInCompare: () => false,
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("compare-items") || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("compare-items", JSON.stringify(items)); }, [items]);

  const addItem = (id: string) => {
    if (items.length >= 4 || items.includes(id)) return;
    setItems(p => [...p, id]);
  };
  const removeItem = (id: string) => setItems(p => p.filter(i => i !== id));
  const clearAll = () => setItems([]);
  const isInCompare = (id: string) => items.includes(id);

  return <CompareContext.Provider value={{ items, addItem, removeItem, clearAll, isInCompare }}>{children}</CompareContext.Provider>;
}

export const useCompare = () => useContext(CompareContext);

export function CompareBar() {
  const { items, removeItem, clearAll } = useCompare();
  const { t } = useI18n();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (items.length === 0) { setProducts([]); return; }
    supabase.from("products").select("id, name, product_images(image_url, is_primary)")
      .in("id", items).then(({ data }) => setProducts(data || []));
  }, [items]);

  if (items.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 inset-x-0 z-50 bg-card border-t border-border shadow-lg p-3"
      >
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            <GitCompareArrows className="h-5 w-5 text-primary flex-shrink-0" />
            {products.map(p => {
              const img = p.product_images?.find((i: any) => i.is_primary)?.image_url || p.product_images?.[0]?.image_url || "/placeholder.svg";
              return (
                <div key={p.id} className="flex items-center gap-2 bg-muted/50 rounded-lg px-2 py-1 flex-shrink-0">
                  <img src={img} alt="" className="h-8 w-8 rounded object-cover" />
                  <span className="text-xs font-medium truncate max-w-[100px]">{p.name}</span>
                  <button onClick={() => removeItem(p.id)}><X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" /></button>
                </div>
              );
            })}
            <Badge variant="secondary" className="text-xs">{items.length}/4</Badge>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={clearAll}>{t("compare.clear")}</Button>
            <Button size="sm" asChild disabled={items.length < 2}>
              <Link to={`/compare?ids=${items.join(",")}`}>{t("compare.compare")} ({items.length})</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

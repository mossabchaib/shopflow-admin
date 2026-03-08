import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock, TrendingUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";

export function SmartSearch({ className = "" }: { className?: string }) {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      supabase.from("search_history").select("query").eq("user_id", user.id)
        .order("created_at", { ascending: false }).limit(5)
        .then(({ data }) => setHistory(data || []));
    }
  }, [user]);

  useEffect(() => {
    if (query.length < 2) { setSuggestions([]); return; }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from("products")
        .select("id, name, product_images(image_url, is_primary)")
        .eq("status", "active")
        .ilike("name", `%${query}%`)
        .limit(6);
      setSuggestions(data || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = async (q: string) => {
    if (!q.trim()) return;
    if (user) {
      await supabase.from("search_history").insert({ user_id: user.id, query: q.trim() });
    }
    setOpen(false);
    navigate(`/shop?q=${encodeURIComponent(q.trim())}`);
  };

  const getImg = (p: any) => {
    const primary = p.product_images?.find((i: any) => i.is_primary);
    return primary?.image_url || p.product_images?.[0]?.image_url || "/placeholder.svg";
  };

  const clearHistory = async () => {
    if (user) {
      await supabase.from("search_history").delete().eq("user_id", user.id);
      setHistory([]);
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <div className="relative">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("shop.search")}
          className="ps-9 pe-9"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={e => e.key === "Enter" && handleSearch(query)}
        />
        {query && (
          <button onClick={() => { setQuery(""); setSuggestions([]); }} className="absolute end-3 top-1/2 -translate-y-1/2">
            <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && (query.length >= 2 || history.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute top-full mt-2 inset-x-0 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden"
          >
            {/* Search history */}
            {query.length < 2 && history.length > 0 && (
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {t("search.recentSearches")}
                  </span>
                  <button onClick={clearHistory} className="text-xs text-destructive hover:underline">{t("search.clear")}</button>
                </div>
                {history.map((h, i) => (
                  <button key={i} onClick={() => { setQuery(h.query); handleSearch(h.query); }}
                    className="w-full text-start px-2 py-1.5 text-sm text-foreground hover:bg-muted rounded-md transition-colors">
                    {h.query}
                  </button>
                ))}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                <span className="text-xs font-medium text-muted-foreground px-2 flex items-center gap-1 mb-1">
                  <TrendingUp className="h-3 w-3" /> {t("search.suggestions")}
                </span>
                {suggestions.map(p => (
                  <button key={p.id} onClick={() => { setOpen(false); navigate(`/product/${p.id}`); }}
                    className="w-full flex items-center gap-3 px-2 py-2 hover:bg-muted rounded-lg transition-colors">
                    <img src={getImg(p)} alt="" className="h-10 w-10 rounded-lg object-cover" />
                    <span className="text-sm font-medium text-foreground truncate">{p.name}</span>
                  </button>
                ))}
                <button onClick={() => handleSearch(query)}
                  className="w-full text-center text-sm text-primary font-medium py-2 hover:bg-muted rounded-lg mt-1">
                  {t("search.viewAll")} "{query}"
                </button>
              </div>
            )}

            {query.length >= 2 && suggestions.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">{t("shop.noProducts")}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Loader2, SlidersHorizontal, X, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

const Shop = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "All");
  const [storeFilter, setStoreFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [showFilters, setShowFilters] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const fetchData = async () => {
      const [prodsRes, catsRes, storesRes] = await Promise.all([
        supabase.from("products").select("*, product_images(image_url, is_primary), categories(name), stores(store_name, slug)").eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
        supabase.from("stores").select("id, store_name, slug").eq("status", "approved").order("store_name"),
      ]);
      const prods = prodsRes.data || [];
      setProducts(prods);
      setCategories(catsRes.data || []);
      setStores(storesRes.data || []);

      // Calculate max price
      if (prods.length > 0) {
        const mp = Math.ceil(Math.max(...prods.map((p: any) => Number(p.discount_price || p.price || 0))));
        setMaxPrice(mp > 0 ? mp : 1000);
        setPriceRange([0, mp > 0 ? mp : 1000]);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const cat = searchParams.get("category");
    if (cat) setCategoryFilter(cat);
  }, [searchParams]);

  const filtered = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.description || "").toLowerCase().includes(search.toLowerCase());
      const matchCat = categoryFilter === "All" || p.category_id === categoryFilter;
      const matchStore = storeFilter === "All" || p.store_id === storeFilter;
      const price = Number(p.discount_price || p.price || 0);
      const matchPrice = price >= priceRange[0] && price <= priceRange[1];
      return matchSearch && matchCat && matchStore && matchPrice;
    })
    .sort((a, b) => {
      const priceA = Number(a.discount_price || a.price || 0);
      const priceB = Number(b.discount_price || b.price || 0);
      switch (sortBy) {
        case "price_asc": return priceA - priceB;
        case "price_desc": return priceB - priceA;
        case "name_asc": return a.name.localeCompare(b.name);
        case "name_desc": return b.name.localeCompare(a.name);
        default: return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  const activeFiltersCount = [
    categoryFilter !== "All",
    storeFilter !== "All",
    priceRange[0] > 0 || priceRange[1] < maxPrice,
  ].filter(Boolean).length;

  function clearFilters() {
    setCategoryFilter("All");
    setStoreFilter("All");
    setPriceRange([0, maxPrice]);
    setSortBy("newest");
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">{t("shop.title")}</h1>
          <span className="text-sm text-muted-foreground">{filtered.length} {t("shop.results")}</span>
        </div>

        {/* Search + Filter Toggle */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("shop.search")} className="ps-9" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{t("shop.newest")}</SelectItem>
                <SelectItem value="price_asc">{t("shop.priceLowHigh")}</SelectItem>
                <SelectItem value="price_desc">{t("shop.priceHighLow")}</SelectItem>
                <SelectItem value="name_asc">{t("shop.nameAZ")}</SelectItem>
                <SelectItem value="name_desc">{t("shop.nameZA")}</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2" onClick={() => setShowFilters(!showFilters)}>
              <SlidersHorizontal className="h-4 w-4" />
              {t("shop.filters")}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-6 p-4 rounded-xl border border-border bg-muted/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">{t("shop.filters")}</h3>
              {activeFiltersCount > 0 && (
                <Button size="sm" variant="ghost" onClick={clearFilters} className="text-xs h-7">
                  <X className="h-3 w-3 mr-1" />{t("shop.clearFilters")}
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Category */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("shop.category")}</label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger><SelectValue placeholder={t("shop.allCategories")} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t("shop.allCategories")}</SelectItem>
                    {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Store */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{t("shop.store")}</label>
                <Select value={storeFilter} onValueChange={setStoreFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">{t("shop.allStores")}</SelectItem>
                    {stores.map(s => <SelectItem key={s.id} value={s.id}>{s.store_name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  {t("shop.priceRange")}: ${priceRange[0]} - ${priceRange[1]}
                </label>
                <Slider
                  min={0}
                  max={maxPrice}
                  step={1}
                  value={priceRange}
                  onValueChange={(v) => setPriceRange(v as [number, number])}
                  className="mt-3"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Active filter badges */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {categoryFilter !== "All" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                {categories.find(c => c.id === categoryFilter)?.name}
                <button onClick={() => setCategoryFilter("All")} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {storeFilter !== "All" && (
              <Badge variant="secondary" className="gap-1 pr-1">
                <Store className="h-3 w-3" />{stores.find(s => s.id === storeFilter)?.store_name}
                <button onClick={() => setStoreFilter("All")} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
              </Badge>
            )}
            {(priceRange[0] > 0 || priceRange[1] < maxPrice) && (
              <Badge variant="secondary" className="gap-1 pr-1">
                ${priceRange[0]} - ${priceRange[1]}
                <button onClick={() => setPriceRange([0, maxPrice])} className="ml-1 hover:text-destructive"><X className="h-3 w-3" /></button>
              </Badge>
            )}
          </div>
        )}
      </motion.div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">{t("shop.noProducts")}</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {filtered.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;

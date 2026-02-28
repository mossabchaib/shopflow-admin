import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const Shop = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "All");

  useEffect(() => {
    const fetchData = async () => {
      const [prodsRes, catsRes] = await Promise.all([
        supabase.from("products").select("*, product_images(image_url, is_primary), categories(name)").eq("status", "active").order("created_at", { ascending: false }),
        supabase.from("categories").select("*").order("name"),
      ]);
      setProducts(prodsRes.data || []);
      setCategories(catsRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || p.category_id === categoryFilter;
    return matchSearch && matchCat;
  });

  const getImage = (p: any) => {
    const primary = p.product_images?.find((i: any) => i.is_primary);
    return primary?.image_url || p.product_images?.[0]?.image_url || "/placeholder.svg";
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.h1 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-foreground mb-8">
        Shop
      </motion.h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[200px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-10">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {filtered.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Link to={`/product/${p.id}`} className="group block">
                <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-3 shadow-sm">
                  <img src={getImage(p)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h3 className="text-sm font-medium text-foreground truncate">{p.name}</h3>
                <p className="text-xs text-muted-foreground truncate">{p.categories?.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {p.discount_price ? (
                    <>
                      <span className="text-sm font-bold text-primary">${Number(p.discount_price).toFixed(2)}</span>
                      <span className="text-xs text-muted-foreground line-through">${Number(p.price).toFixed(2)}</span>
                    </>
                  ) : (
                    <span className="text-sm font-bold text-foreground">${Number(p.price).toFixed(2)}</span>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shop;

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Search, Store as StoreIcon, Star, Loader2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

const Stores = () => {
  const { t } = useI18n();
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetch = async () => {
      const { data: storesData } = await supabase
        .from("stores")
        .select("*, store_reviews(rating)")
        .eq("status", "approved")
        .order("created_at", { ascending: false });

      // Count products per store
      const storeIds = (storesData || []).map((s: any) => s.id);
      let productCounts: Record<string, number> = {};
      if (storeIds.length > 0) {
        const { data: prods } = await supabase
          .from("products")
          .select("store_id")
          .in("store_id", storeIds)
          .eq("status", "active");
        (prods || []).forEach((p: any) => {
          productCounts[p.store_id] = (productCounts[p.store_id] || 0) + 1;
        });
      }

      setStores(
        (storesData || []).map((s: any) => {
          const reviews = s.store_reviews || [];
          const avg = reviews.length > 0 ? reviews.reduce((a: number, r: any) => a + r.rating, 0) / reviews.length : 0;
          return { ...s, avgRating: avg, reviewCount: reviews.length, productCount: productCounts[s.id] || 0 };
        })
      );
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = stores.filter(
    (s) =>
      s.store_name.toLowerCase().includes(search.toLowerCase()) ||
      s.description?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{t("stores.title")}</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">{t("stores.subtitle")}</p>
        </div>

        <div className="max-w-md mx-auto mb-10">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("stores.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ps-9"
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <StoreIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">{t("stores.noStores")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((store, i) => (
              <motion.div
                key={store.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
              >
                <Link
                  to={`/store/${store.slug}`}
                  className="group block rounded-2xl overflow-hidden border bg-card hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                >
                  {/* Cover */}
                  <div className="aspect-[16/9] overflow-hidden bg-muted relative">
                    {store.background_url ? (
                      <img
                        src={store.background_url}
                        alt={store.store_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/5 to-secondary/20 flex items-center justify-center">
                        <StoreIcon className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                    )}
                    {/* Logo overlay */}
                    {store.logo_url && (
                      <div className="absolute -bottom-6 start-4">
                        <img
                          src={store.logo_url}
                          alt=""
                          className="h-12 w-12 rounded-xl object-cover border-2 border-card shadow-lg"
                        />
                      </div>
                    )}
                  </div>

                  <div className="p-5 pt-8">
                    <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors mb-1">
                      {store.store_name}
                    </h3>
                    {store.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{store.description}</p>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {store.avgRating > 0 ? (
                          <>
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-medium text-foreground">{store.avgRating.toFixed(1)}</span>
                            <span className="text-xs text-muted-foreground">({store.reviewCount})</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted-foreground">{t("stores.noRatings")}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Package className="h-3 w-3" />
                        {store.productCount} {t("stores.products")}
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default Stores;

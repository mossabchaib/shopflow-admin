import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useStoreContext } from "@/hooks/useStoreContext";

const StoreHome = () => {
  const { store, basePath } = useStoreContext();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    if (!store) return;
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(image_url, is_primary), categories(name)")
        .eq("store_id", store.id)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(12);
      setProducts(data || []);
      setLoading(false);
    };
    fetchProducts();
  }, [store]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[75vh] min-h-[520px] flex items-center justify-center overflow-hidden">
        {store?.background_url ? (
          <img src={store.background_url} alt={store.store_name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30" />
        )}
        <div className="absolute inset-0 bg-foreground/50" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative text-center px-4 max-w-3xl"
        >
          {store?.logo_url && (
            <img src={store.logo_url} alt={store.store_name} className="h-20 w-20 rounded-xl object-cover mx-auto mb-4 border-2 border-white/50 shadow-lg" />
          )}
          <h1 className="text-4xl md:text-6xl font-bold text-card mb-4 leading-tight">
            {store?.store_name}
          </h1>
          {store?.description && (
            <p className="text-base md:text-lg text-card/80 mb-8 max-w-xl mx-auto leading-relaxed">
              {store.description}
            </p>
          )}
          <Button size="lg" asChild className="px-8 h-12 text-base font-semibold">
            <Link to={`${basePath}/shop`}>{t("hero.cta")} <ArrowRight className="ms-2 h-5 w-5" /></Link>
          </Button>
        </motion.div>
      </section>

      {/* Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-foreground"
          >
            {t("home.discoverProducts")}
          </motion.h2>
          <Link to={`${basePath}/shop`} className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
            {t("home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {products.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">{t("home.noProducts")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} storeBasePath={basePath} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StoreHome;

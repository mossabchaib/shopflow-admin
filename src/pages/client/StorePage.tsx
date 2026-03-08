import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

const StorePage = () => {
  const { slug } = useParams();
  const [store, setStore] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    const fetchStore = async () => {
      const { data: storeData } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();

      if (!storeData) {
        setLoading(false);
        return;
      }
      setStore(storeData);

      const { data: prods } = await supabase
        .from("products")
        .select("*, product_images(image_url, is_primary), categories(name)")
        .eq("store_id", storeData.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      setProducts(prods || []);
      setLoading(false);
    };
    fetchStore();
  }, [slug]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!store) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <StoreIcon className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground text-lg">{t("store.notFound")}</p>
      <Button asChild><Link to="/">{t("nav.home")}</Link></Button>
    </div>
  );

  return (
    <div>
      {/* Store Hero */}
      <section className="relative h-[50vh] min-h-[360px] flex items-center justify-center overflow-hidden">
        {store.background_url ? (
          <img src={store.background_url} alt={store.store_name} className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
        )}
        <div className="absolute inset-0 bg-foreground/40" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center px-4"
        >
          {store.logo_url && (
            <img src={store.logo_url} alt={store.store_name} className="h-20 w-20 rounded-xl object-cover mx-auto mb-4 border-2 border-white/50 shadow-lg" />
          )}
          <h1 className="text-3xl md:text-5xl font-bold text-card mb-3">{store.store_name}</h1>
          {store.description && (
            <p className="text-card/80 max-w-xl mx-auto">{store.description}</p>
          )}
        </motion.div>
      </section>

      {/* Store Products */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-xl font-bold text-foreground mb-8">{t("store.products")} ({products.length})</h2>
        {products.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">{t("shop.noProducts")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default StorePage;

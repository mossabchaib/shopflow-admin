import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { SmartSearch } from "@/components/SmartSearch";
import { FlashDeals } from "@/components/FlashDeals";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import { Recommendations } from "@/components/Recommendations";
import heroBg from "@/assets/hero-bg.jpg";

const Home = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [randomProducts, setRandomProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    const fetchData = async () => {
      const [storesRes, productsRes] = await Promise.all([
        supabase.from("stores").select("*").eq("status", "approved").order("created_at", { ascending: false }).limit(8),
        supabase.from("products")
          .select("*, product_images(image_url, is_primary), categories(name), stores(store_name, slug)")
          .eq("status", "active")
          .order("created_at", { ascending: false })
          .limit(20),
      ]);
      setStores(storesRes.data || []);
      const prods = productsRes.data || [];
      for (let i = prods.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [prods[i], prods[j]] = [prods[j], prods[i]];
      }
      setRandomProducts(prods.slice(0, 12));
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[75vh] min-h-[520px] flex items-center justify-center overflow-hidden">
        <img src={heroBg} alt="Hero" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-foreground/50" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative text-center px-4 max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-card mb-4 leading-tight">{t("hero.title")}</h1>
          <p className="text-base md:text-lg text-card/80 mb-6 max-w-xl mx-auto leading-relaxed">{t("hero.subtitle")}</p>

          {/* Smart Search in Hero */}
          <div className="max-w-lg mx-auto mb-6">
            <SmartSearch className="[&_input]:bg-card/90 [&_input]:border-card/30 [&_input]:text-foreground [&_input]:placeholder:text-muted-foreground" />
          </div>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button size="lg" asChild className="px-8 h-12 text-base font-semibold">
              <Link to="/shop">{t("hero.cta")} <ArrowRight className="ms-2 h-5 w-5" /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="px-8 h-12 text-base font-semibold bg-card/10 border-card/30 text-card hover:bg-card/20">
              <Link to="/request-store">{t("seller.openStore")} <StoreIcon className="ms-2 h-5 w-5" /></Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* Flash Deals */}
      <FlashDeals />

      {/* Recommendations */}
      <Recommendations />

      {/* Stores Section */}
      {stores.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-2xl md:text-3xl font-bold text-foreground mb-10 text-center"
          >{t("home.featuredStores")}</motion.h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {stores.map((store, i) => (
              <motion.div key={store.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }}>
                <Link to={`/store/${store.slug}`} className="group block rounded-xl overflow-hidden border bg-card hover:shadow-md transition-shadow duration-300">
                  <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                    {store.background_url ? (
                      <img src={store.background_url} alt={store.store_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                        <StoreIcon className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    {store.logo_url && <img src={store.logo_url} alt="" className="absolute bottom-2 start-2 h-10 w-10 rounded-lg object-cover border-2 border-card shadow" />}
                  </div>
                  <div className="p-4"><h3 className="text-sm font-semibold text-foreground text-center">{store.store_name}</h3></div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Discover Products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="flex items-center justify-between mb-10">
          <motion.h2 initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-2xl md:text-3xl font-bold text-foreground">
            {t("home.discoverProducts")}
          </motion.h2>
          <Link to="/shop" className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
            {t("home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {randomProducts.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">{t("home.noProducts")}</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
            {randomProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </section>

      {/* Recently Viewed */}
      <RecentlyViewed />
    </div>
  );
};

export default Home;

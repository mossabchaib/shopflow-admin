import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import heroBg from "@/assets/hero-bg.jpg";

const Home = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    const fetchData = async () => {
      const { data: cats } = await supabase.from("categories").select("*").order("name");
      setCategories(cats || []);

      const { data: products } = await supabase
        .from("products")
        .select("*, product_images(image_url, is_primary), categories(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      const grouped: Record<string, any[]> = {};
      (products || []).forEach((p: any) => {
        const catId = p.category_id;
        if (!catId) return;
        if (!grouped[catId]) grouped[catId] = [];
        if (grouped[catId].length < 5) grouped[catId].push(p);
      });
      setProductsByCategory(grouped);
      setLoading(false);
    };
    fetchData();
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[75vh] min-h-[520px] flex items-center justify-center overflow-hidden">
        <img
          src={heroBg}
          alt="Hero"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-foreground/50" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative text-center px-4 max-w-3xl"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-card mb-4 leading-tight">
            {t("hero.title")}
          </h1>
          <p className="text-base md:text-lg text-card/80 mb-8 max-w-xl mx-auto leading-relaxed">
            {t("hero.subtitle")}
          </p>
          <Button size="lg" asChild className="px-8 h-12 text-base font-semibold">
            <Link to="/shop">{t("hero.cta")} <ArrowRight className="ms-2 h-5 w-5" /></Link>
          </Button>
        </motion.div>
      </section>

      {/* Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-foreground mb-10 text-center"
        >
          {t("home.categories")}
        </motion.h2>

        {categories.length === 0 ? (
          <p className="text-center text-muted-foreground">{t("home.noCategories")}</p>
        ) : (
          <>
            {/* Category cards grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    to={`/shop?category=${cat.id}`}
                    className="group block rounded-xl overflow-hidden border bg-card hover:shadow-md transition-shadow duration-300"
                  >
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={cat.image_url || "/placeholder.svg"}
                        alt={cat.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-foreground text-center">{cat.name}</h3>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Products by category */}
            <div className="space-y-14">
              {categories.map((cat, ci) => {
                const prods = productsByCategory[cat.id] || [];
                return (
                  <motion.div
                    key={cat.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: ci * 0.08 }}
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-foreground">{cat.name}</h3>
                      <Link to={`/shop?category=${cat.id}`} className="text-sm text-primary hover:underline flex items-center gap-1 font-medium">
                        {t("home.viewAll")} <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    {prods.length === 0 ? (
                      <p className="text-muted-foreground text-sm">{t("home.noProducts")}</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {prods.map((p, pi) => (
                          <ProductCard key={p.id} product={p} index={pi} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Home;

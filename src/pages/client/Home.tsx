import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

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

  const getImage = (p: any) => {
    const primary = p.product_images?.find((i: any) => i.is_primary);
    return primary?.image_url || p.product_images?.[0]?.image_url || "/placeholder.svg";
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      {/* Hero */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center justify-center bg-gradient-to-br from-primary to-secondary overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg')] bg-cover bg-center opacity-10" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="relative text-center px-4"
        >
          <h1 className="text-4xl md:text-6xl font-bold text-primary-foreground mb-4">Discover Your Style</h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">Shop the latest trends with premium quality products, curated just for you.</p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/shop">Shop Now <ArrowRight className="ml-2 h-5 w-5" /></Link>
          </Button>
        </motion.div>
      </section>

      {/* Categories with products */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-3xl font-bold text-foreground mb-10 text-center">
          Our Categories
        </motion.h2>

        {categories.length === 0 && <p className="text-center text-muted-foreground">No categories yet.</p>}

        <div className="space-y-16">
          {categories.map((cat, ci) => {
            const prods = productsByCategory[cat.id] || [];
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: ci * 0.1 }}
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-foreground">{cat.name}</h3>
                  <Link to={`/shop?category=${cat.id}`} className="text-sm text-primary hover:underline flex items-center gap-1">
                    View All <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                {prods.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No products in this category yet.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {prods.map((p: any, pi: number) => (
                      <motion.div
                        key={p.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: pi * 0.05 }}
                      >
                        <Link to={`/product/${p.id}`} className="group block">
                          <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-3">
                            <img src={getImage(p)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          </div>
                          <h4 className="text-sm font-medium text-foreground truncate">{p.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            {p.discount_price ? (
                              <>
                                <span className="text-sm font-semibold text-primary">${Number(p.discount_price).toFixed(2)}</span>
                                <span className="text-xs text-muted-foreground line-through">${Number(p.price).toFixed(2)}</span>
                              </>
                            ) : (
                              <span className="text-sm font-semibold text-foreground">${Number(p.price).toFixed(2)}</span>
                            )}
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    </div>
  );
};

export default Home;

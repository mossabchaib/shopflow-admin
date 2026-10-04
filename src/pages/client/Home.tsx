
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Loader2,
  ShoppingBag,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

const Home = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [productsByCategory, setProductsByCategory] = useState<
    Record<string, any[]>
  >({});
  const [loading, setLoading] = useState(true);

  const { t } = useI18n();

  useEffect(() => {
    const fetchData = async () => {
      const { data: cats } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      setCategories(cats || []);

      const { data: products } = await supabase
        .from("products")
        .select(
          "*, product_images(image_url, is_primary), categories(name)"
        )
        .eq("status", "active")
        .order("created_at", { ascending: false });

      const grouped: Record<string, any[]> = {};

      (products || []).forEach((p: any) => {
        const catId = p.category_id;

        if (!catId) return;

        if (!grouped[catId]) {
          grouped[catId] = [];
        }

        if (grouped[catId].length < 5) {
          grouped[catId].push(p);
        }
      });

      setProductsByCategory(grouped);
      setLoading(false);
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>

          <span className="text-sm text-muted-foreground">
            {t("common.loading")}
          </span>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-background">

      {/* =========================================================
          HERO
      ========================================================= */}
      <section className="relative overflow-hidden">
        <div className="relative min-h-[600px] lg:min-h-[700px]">

          {/* Hero image */}
          <img
            src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=2200&q=90"
            alt={t("home.heroImageAlt")}
            className="absolute inset-0 h-full w-full object-cover"
          />

          {/* Dark cinematic overlay */}
          <div className="absolute inset-0 bg-black/35" />

          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

          {/* Decorative glow */}
          <div className="absolute -right-40 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-white/10 blur-[120px]" />

          {/* Hero content */}
          <div className="relative mx-auto flex min-h-[600px] max-w-7xl items-center px-5 py-20 sm:px-8 lg:min-h-[700px] lg:px-12">

            <motion.div
              initial={{ opacity: 0, x: -35 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.8,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="max-w-2xl text-white"
            >

              {/* Eyebrow */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.15,
                  duration: 0.5,
                }}
                className="mb-6 flex items-center gap-3"
              >
                <span className="h-px w-10 bg-white/70" />

                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-white/80">
                  {t("home.newCollection")}
                </span>
              </motion.div>

              {/* Main title */}
              <h1 className="max-w-2xl text-5xl font-bold leading-[0.98] tracking-[-0.04em] sm:text-6xl md:text-7xl lg:text-[82px]">
                {t("hero.title")}
              </h1>

              {/* Description */}
              <p className="mt-7 max-w-lg text-base leading-7 text-white/75 sm:text-lg">
                {t("hero.subtitle")}
              </p>

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.35,
                  duration: 0.5,
                }}
                className="mt-9"
              >
             <div className="mt-9 flex justify-center">
  <Button
    size="lg"
    asChild
    className="group h-14 rounded-full bg-white px-5 text-[15px] font-semibold text-black shadow-[0_8px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:bg-white hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]"
  >
    <Link
      to="/shop"
      className="flex items-center gap-3"
    >
      <span>{t("home.shopNow")}</span>

      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-black text-white transition-all duration-300 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5">
        <ArrowRight className="h-4 w-4 rtl:rotate-180" />
      </span>
    </Link>
  </Button>
</div>
              </motion.div>

            </motion.div>
          </div>

          {/* Bottom scroll indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 1,
              duration: 0.8,
            }}
            className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/50 md:flex"
          >
            <span className="text-[10px] uppercase tracking-[0.25em]">
              {t("home.discover")}
            </span>

            <div className="h-8 w-px bg-gradient-to-b from-white/60 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* =========================================================
          CATEGORIES
      ========================================================= */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">

        <div className="mb-10 flex items-end justify-between gap-6">

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-7 bg-primary" />

              {t("home.collections")}
            </div>

            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {t("home.categories")}
            </h2>
          </motion.div>

          {categories.length > 0 && (
            <Link
              to="/shop"
              className="hidden items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground sm:flex"
            >
              {t("home.viewAll")}

              <ArrowUpRight className="h-4 w-4" />
            </Link>
          )}
        </div>

        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center">
            <p className="text-muted-foreground">
              {t("home.noCategories")}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.id}
                  initial={{
                    opacity: 0,
                    y: 25,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    margin: "-50px",
                  }}
                  transition={{
                    duration: 0.5,
                    delay: i * 0.06,
                  }}
                >
                  <Link
                    to={`/shop?category=${cat.id}`}
                    className="group relative block overflow-hidden rounded-2xl bg-muted"
                  >
                    <div className="aspect-[4/5] overflow-hidden">
                      <img
                        src={cat.image_url || "/placeholder.svg"}
                        alt={cat.name}
                        className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-110"
                      />
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
                      <div className="flex items-end justify-between gap-2">

                        <h3 className="text-base font-semibold text-white sm:text-lg">
                          {cat.name}
                        </h3>

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-all duration-300 group-hover:bg-white group-hover:text-black">
                          <ArrowUpRight className="h-4 w-4" />
                        </div>

                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            <Link
              to="/shop"
              className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-muted-foreground sm:hidden"
            >
              {t("home.viewAll")}

              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        )}
      </section>

      {/* =========================================================
          PRODUCTS
      ========================================================= */}
      <section className="border-t bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">

          <div className="space-y-20">

            {categories.map((cat) => {
              const prods = productsByCategory[cat.id] || [];

              return (
                <motion.div
                  key={cat.id}
                  initial={{
                    opacity: 0,
                    y: 25,
                  }}
                  whileInView={{
                    opacity: 1,
                    y: 0,
                  }}
                  viewport={{
                    once: true,
                    margin: "-80px",
                  }}
                  transition={{
                    duration: 0.6,
                  }}
                >

                  <div className="mb-7 flex items-end justify-between gap-4">

                    <div>
                      <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                        {t("home.featured")}
                      </div>

                      <h3 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        {cat.name}
                      </h3>
                    </div>

                    <Link
                      to={`/shop?category=${cat.id}`}
                      className="group flex shrink-0 items-center gap-1.5 rounded-full border bg-background px-4 py-2 text-sm font-medium transition-all hover:border-primary hover:text-primary"
                    >
                      <span className="hidden sm:inline">
                        {t("home.viewAll")}
                      </span>

                      <span className="sm:hidden">
                        {t("home.view")}
                      </span>

                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                    </Link>

                  </div>

                  {prods.length === 0 ? (
                    <div className="rounded-2xl border border-dashed bg-background p-10 text-center">
                      <p className="text-sm text-muted-foreground">
                        {t("home.noProducts")}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-5 md:grid-cols-4 lg:grid-cols-5">

                      {prods.map((p, pi) => (
                        <motion.div
                          key={p.id}
                          initial={{
                            opacity: 0,
                            y: 20,
                          }}
                          whileInView={{
                            opacity: 1,
                            y: 0,
                          }}
                          viewport={{
                            once: true,
                          }}
                          transition={{
                            duration: 0.4,
                            delay: pi * 0.05,
                          }}
                        >
                          <ProductCard
                            product={p}
                            index={pi}
                          />
                        </motion.div>
                      ))}

                    </div>
                  )}

                </motion.div>
              );
            })}

          </div>

        </div>
      </section>

    </main>
  );
};

export default Home;

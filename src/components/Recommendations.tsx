import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

export function Recommendations() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      let categoryIds: string[] = [];

      if (user) {
        // Get user preferences
        const { data: prefs } = await supabase
          .from("customer_preferences")
          .select("interests")
          .eq("user_id", user.id)
          .maybeSingle();

        if (prefs?.interests && prefs.interests.length > 0) {
          // Map interests to categories
          const { data: cats } = await supabase
            .from("categories")
            .select("id, name");
          if (cats) {
            const interestLower = prefs.interests.map((i: string) => i.toLowerCase());
            categoryIds = cats
              .filter(c => interestLower.some((int: string) => c.name.toLowerCase().includes(int)))
              .map(c => c.id);
          }
        }

        // Also get categories from recently viewed
        const { data: views } = await supabase
          .from("recently_viewed")
          .select("products(category_id)")
          .eq("user_id", user.id)
          .order("viewed_at", { ascending: false })
          .limit(10);
        if (views) {
          const viewCats = views.map((v: any) => v.products?.category_id).filter(Boolean);
          categoryIds = [...new Set([...categoryIds, ...viewCats])];
        }
      }

      let query = supabase
        .from("products")
        .select("*, product_images(image_url, is_primary), categories(name)")
        .eq("status", "active");

      if (categoryIds.length > 0) {
        query = query.in("category_id", categoryIds);
      }

      const { data } = await query.order("created_at", { ascending: false }).limit(12);
      const prods = data || [];
      // Shuffle
      for (let i = prods.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [prods[i], prods[j]] = [prods[j], prods[i]];
      }
      setProducts(prods.slice(0, 8));
    };
    fetch();
  }, [user]);

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <Sparkles className="h-5 w-5 text-amber-500" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{t("home.recommended")}</h2>
          <p className="text-sm text-muted-foreground">{t("home.recommendedDesc")}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

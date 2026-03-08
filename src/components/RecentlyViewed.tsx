import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";

export function RecentlyViewed() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data: views } = await supabase
        .from("recently_viewed")
        .select("product_id")
        .eq("user_id", user.id)
        .order("viewed_at", { ascending: false })
        .limit(8);
      if (!views || views.length === 0) return;
      const ids = views.map(v => v.product_id);
      const { data: prods } = await supabase
        .from("products")
        .select("*, product_images(image_url, is_primary), categories(name)")
        .in("id", ids)
        .eq("status", "active");
      // Maintain order from recently_viewed
      const prodMap = new Map((prods || []).map(p => [p.id, p]));
      setProducts(ids.map(id => prodMap.get(id)).filter(Boolean));
    };
    fetch();
  }, [user]);

  if (products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Eye className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl md:text-2xl font-bold text-foreground">{t("home.recentlyViewed")}</h2>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {products.map((p, i) => (
          <ProductCard key={p.id} product={p} index={i} />
        ))}
      </div>
    </section>
  );
}

export async function trackProductView(userId: string, productId: string) {
  await supabase.from("recently_viewed").upsert(
    { user_id: userId, product_id: productId, viewed_at: new Date().toISOString() },
    { onConflict: "user_id,product_id" }
  );
}

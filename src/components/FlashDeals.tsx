import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

function Countdown({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("00:00:00"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <div className="flex items-center gap-1.5 text-destructive font-mono text-sm font-bold">
      <Clock className="h-3.5 w-3.5" />
      {timeLeft}
    </div>
  );
}

export function FlashDeals() {
  const [deals, setDeals] = useState<any[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    const fetchDeals = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("flash_deals")
        .select("*, products(id, name, price, product_images(image_url, is_primary))")
        .eq("is_active", true)
        .lte("starts_at", now)
        .gte("ends_at", now)
        .limit(8);
      setDeals(data || []);
    };
    fetchDeals();
  }, []);

  if (deals.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
          <Zap className="h-5 w-5 text-destructive" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{t("flash.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("flash.subtitle")}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {deals.map((deal, i) => {
          const product = deal.products;
          if (!product) return null;
          const img = product.product_images?.find((i: any) => i.is_primary)?.image_url || product.product_images?.[0]?.image_url || "/placeholder.svg";
          const discount = Math.round(((product.price - deal.deal_price) / product.price) * 100);

          return (
            <motion.div
              key={deal.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link to={`/product/${product.id}`} className="group block rounded-xl border border-destructive/20 bg-card overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square overflow-hidden bg-muted relative">
                  <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-2 start-2 bg-destructive text-destructive-foreground text-xs font-bold px-2 py-1 rounded-md">
                    -{discount}%
                  </div>
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="text-sm font-medium text-foreground truncate">{product.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-destructive">${Number(deal.deal_price).toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground line-through">${Number(product.price).toFixed(2)}</span>
                  </div>
                  <Countdown endsAt={deal.ends_at} />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

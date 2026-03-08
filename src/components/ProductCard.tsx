import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useState } from "react";

interface ProductCardProps {
  product: any;
  index?: number;
  isFavorite?: boolean;
  onFavoriteToggle?: (productId: string, isFav: boolean) => void;
  /** When inside a store, links go to /store/:slug/product/:id */
  storeBasePath?: string;
}

export function ProductCard({ product, index = 0, isFavorite = false, onFavoriteToggle, storeBasePath }: ProductCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [favState, setFavState] = useState(isFavorite);

  const getImage = () => {
    const primary = product.product_images?.find((i: any) => i.is_primary);
    return primary?.image_url || product.product_images?.[0]?.image_url || "/placeholder.svg";
  };

  const price = product.discount_price || product.price;

  const handleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast({ title: t("common.pleaseSignIn"), variant: "destructive" });
      return;
    }
    if (favState) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id);
      setFavState(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: product.id });
      setFavState(true);
    }
    onFavoriteToggle?.(product.id, !favState);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="group relative"
    >
      <Link to={storeBasePath ? `${storeBasePath}/product/${product.id}` : `/product/${product.id}`} className="block">
        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted mb-3 relative">
          <img
            src={getImage()}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Overlay actions */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />
           <div className="absolute bottom-3 left-3 right-3 flex gap-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <Button
              size="sm"
              className="flex-1 h-9 text-xs font-medium"
            >
              <Eye className="h-3.5 w-3.5 me-1.5" />
              {t("product.viewProduct")}
            </Button>
          </div>
          {/* Fav button */}
          <button
            onClick={handleFavorite}
            className="absolute top-3 end-3 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-card"
          >
            <Heart className={`h-4 w-4 ${favState ? "fill-destructive text-destructive" : "text-foreground"}`} />
          </button>
          {/* Discount badge */}
          {product.discount_price && (
            <div className="absolute top-3 start-3 bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-md">
              -{Math.round(((product.price - product.discount_price) / product.price) * 100)}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{product.categories?.name || ""}</p>
          <h3 className="text-sm font-medium text-foreground truncate leading-tight">{product.name}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-success">${Number(price).toFixed(2)}</span>
            {product.discount_price && (
              <span className="text-xs text-destructive line-through">${Number(product.price).toFixed(2)}</span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

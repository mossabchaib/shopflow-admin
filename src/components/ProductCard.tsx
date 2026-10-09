import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart } from "lucide-react";
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
}

export function ProductCard({ product, index = 0, isFavorite = false, onFavoriteToggle }: ProductCardProps) {
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
    if (!user) return;

    if (favState) {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", product.id);
      if (error) {
        toast({ title: t("common.error"), description: error.message, variant: "destructive" });
        return;
      }
      setFavState(false);
    } else {
      const { error } = await supabase
        .from("favorites")
        .insert({ user_id: user.id, product_id: product.id });
      if (error) {
        toast({ title: t("common.error"), description: error.message, variant: "destructive" });
        return;
      }
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
      <Link to={`/product/${product.id}`} className="block">
        <div className="aspect-[3/4] rounded-xl overflow-hidden bg-muted mb-3 relative">
          <img
            src={getImage()}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors duration-300" />

          {/* Fav button: logged-in users only. Always visible on mobile, hover-only on desktop */}
          {user && (
            <button
              type="button"
              onClick={handleFavorite}
              aria-label={favState ? "Remove from favorites" : "Add to favorites"}
              className="absolute top-3 end-3 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 hover:bg-card"
            >
              <Heart className={`h-4 w-4 ${favState ? "fill-destructive text-destructive" : "text-foreground"}`} />
            </button>
          )}

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
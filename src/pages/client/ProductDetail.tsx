import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Loader2, Minus, Plus, Star, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useGuestCart } from "@/hooks/useGuestCart";
import { useI18n } from "@/lib/i18n";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { addItem } = useGuestCart();
  const { t } = useI18n();
  const [product, setProduct] = useState<any>(null);
  const [images, setImages] = useState<any[]>([]);
  const [sizes, setSizes] = useState<any[]>([]);
  const [colors, setColors] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFav, setIsFav] = useState(false);
  // Review form
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true);
      const [prodRes, imgRes, sizeRes, colorRes, varRes] = await Promise.all([
        supabase.from("products").select("*, categories(id, name)").eq("id", id).single(),
        supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
        supabase.from("product_sizes").select("*").eq("product_id", id).order("size_label"),
        supabase.from("product_colors").select("*").eq("product_id", id).order("color_name"),
        supabase.from("product_variants").select("*").eq("product_id", id),
      ]);

      setProduct(prodRes.data);
      setImages(imgRes.data || []);
      setSizes(sizeRes.data || []);
      setColors(colorRes.data || []);
      setVariants(varRes.data || []);

      // Related products
      if (prodRes.data?.category_id) {
        const { data: rel } = await supabase
          .from("products")
          .select("*, product_images(image_url, is_primary), categories(name)")
          .eq("category_id", prodRes.data.category_id)
          .neq("id", id)
          .eq("status", "active")
          .limit(6);
        setRelated(rel || []);
      }

      // Reviews
      const { data: revs } = await supabase
        .from("reviews")
        .select("*, profiles!reviews_customer_id_fkey(name, email)")
        .eq("product_id", id)
        .eq("status", "approved")
        .order("created_at", { ascending: false });
      setReviews(revs || []);

      // Favorite
      if (user) {
        const { data: fav } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("product_id", id).maybeSingle();
        setIsFav(!!fav);
      }

      setLoading(false);
    };
    fetchAll();
  }, [id, user]);

  const toggleFav = async () => {
    if (!user) { toast({ title: t("common.pleaseSignIn"), variant: "destructive" }); return; }
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id!);
      setIsFav(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: id! });
      setIsFav(true);
    }
  };

  const addToCart = async () => {
    if (sizes.length > 0 && !selectedSize) {
      toast({ title: t("product.size"), description: "Please select a size", variant: "destructive" });
      return;
    }
    if (colors.length > 0 && !selectedColor) {
      toast({ title: t("product.color") || "Color", description: "Please select a color", variant: "destructive" });
      return;
    }
    if (user) {
      const { error } = await supabase.from("cart_items").insert({
        user_id: user.id,
        product_id: id!,
        size_id: selectedSize,
        color_id: selectedColor,
        quantity,
      });
      if (error) { toast({ title: t("common.error"), description: error.message, variant: "destructive" }); return; }
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    } else {
      addItem(id!, selectedSize, quantity, selectedColor);
    }
    toast({ title: t("product.addToCart") + " ✓" });
  };

  const price = product?.discount_price || product?.price || 0;
  const sizeExtra = sizes.find(s => s.id === selectedSize)?.extra_price || 0;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!product) return <div className="text-center py-20 text-muted-foreground">{t("product.notFound")}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Images */}
        <div>
          <div className="aspect-square rounded-2xl overflow-hidden bg-muted mb-4">
            <img src={images[selectedImage]?.image_url || "/placeholder.svg"} alt={product.name} className="w-full h-full object-cover" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {images.map((img, i) => (
                <button key={img.id} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-colors ${i === selectedImage ? "border-primary" : "border-transparent hover:border-border"}`}>
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <p className="text-sm text-primary font-medium">{product.categories?.name}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground mt-1">{product.name}</h1>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-success">${(Number(price) + Number(sizeExtra)).toFixed(2)}</span>
            {product.discount_price && <span className="text-lg text-destructive line-through">${Number(product.price).toFixed(2)}</span>}
          </div>

          {product.description && <p className="text-muted-foreground leading-relaxed">{product.description}</p>}

          {/* Colors */}
          {colors.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">{t("product.color") || "Color"}</p>
              <div className="flex flex-wrap gap-3">
                {colors.map(c => {
                  // Calculate available stock for this color (across all sizes or for selected size)
                  const colorStock = selectedSize
                    ? (variants.find(v => v.color_id === c.id && v.size_id === selectedSize)?.stock ?? 0)
                    : variants.filter(v => v.color_id === c.id).reduce((a: number, v: any) => a + v.stock, 0);
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedColor(c.id)}
                      disabled={colorStock <= 0}
                      title={`${c.color_name} (${colorStock} in stock)`}
                      className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                        selectedColor === c.id ? "border-primary ring-2 ring-primary/30 scale-110" :
                        colorStock <= 0 ? "border-border opacity-40 cursor-not-allowed" :
                        "border-border hover:border-primary"
                      }`}
                    >
                      <span className="block w-full h-full rounded-full" style={{ backgroundColor: c.color_hex }} />
                      {colorStock <= 0 && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <span className="w-8 h-0.5 bg-destructive rotate-45 rounded-full" />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {selectedColor && (
                <p className="text-xs text-muted-foreground mt-1">
                  {colors.find(c => c.id === selectedColor)?.color_name}
                </p>
              )}
            </div>
          )}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">{t("product.size")}</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(s => {
                  const sizeStock = selectedColor
                    ? (variants.find(v => v.size_id === s.id && v.color_id === selectedColor)?.stock ?? 0)
                    : variants.filter(v => v.size_id === s.id).reduce((a: number, v: any) => a + v.stock, 0);
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSize(s.id)}
                      disabled={sizeStock <= 0}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        selectedSize === s.id ? "border-primary bg-primary/10 text-primary" :
                        sizeStock <= 0 ? "border-border text-muted-foreground opacity-50 cursor-not-allowed" :
                        "border-border text-foreground hover:border-primary"
                      }`}
                    >
                      {s.size_label}
                      {sizeStock <= 0 && <span className="block text-xs">{t("product.outOfStock")}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-foreground">{t("product.quantity")}</p>
            <div className="flex items-center border rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2"><Minus className="h-4 w-4" /></button>
              <span className="px-4 text-sm font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1 h-12" onClick={addToCart}>
              <ShoppingCart className="h-5 w-5 me-2" /> {t("product.addToCart")}
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12" onClick={toggleFav}>
              <Heart className={`h-5 w-5 ${isFav ? "fill-destructive text-destructive" : ""}`} />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Related Products */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold text-foreground mb-6">{t("product.related")}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {related.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

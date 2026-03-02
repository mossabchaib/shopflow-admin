import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ShoppingCart, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true);
      const [prodRes, imgRes, sizeRes] = await Promise.all([
        supabase.from("products").select("*, categories(id, name)").eq("id", id).single(),
        supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
        supabase.from("product_sizes").select("*").eq("product_id", id).order("size_label"),
      ]);

      setProduct(prodRes.data);
      setImages(imgRes.data || []);
      setSizes(sizeRes.data || []);

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
    if (user) {
      const { error } = await supabase.from("cart_items").insert({ user_id: user.id, product_id: id!, size_id: selectedSize, quantity });
      if (error) { toast({ title: t("common.error"), description: error.message, variant: "destructive" }); return; }
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    } else {
      addItem(id!, selectedSize, quantity);
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
            <span className="text-3xl font-bold text-foreground">${(Number(price) + Number(sizeExtra)).toFixed(2)}</span>
            {product.discount_price && <span className="text-lg text-muted-foreground line-through">${Number(product.price).toFixed(2)}</span>}
          </div>

          {product.description && <p className="text-muted-foreground leading-relaxed">{product.description}</p>}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">{t("product.size")}</p>
              <div className="flex flex-wrap gap-2">
                {sizes.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSize(s.id)}
                    disabled={s.stock <= 0}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      selectedSize === s.id ? "border-primary bg-primary/10 text-primary" :
                      s.stock <= 0 ? "border-border text-muted-foreground opacity-50 cursor-not-allowed" :
                      "border-border text-foreground hover:border-primary"
                    }`}
                  >
                    {s.size_label}
                    {s.stock <= 0 && <span className="block text-xs">{t("product.outOfStock")}</span>}
                  </button>
                ))}
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

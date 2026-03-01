import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Heart, ShoppingCart, Loader2, Minus, Plus } from "lucide-react";
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
  const [reviews, setReviews] = useState<any[]>([]);
  const [related, setRelated] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isFav, setIsFav] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true);
      const [prodRes, imgRes, sizeRes, revRes] = await Promise.all([
        supabase.from("products").select("*, categories(id, name)").eq("id", id).single(),
        supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
        supabase.from("product_sizes").select("*").eq("product_id", id).order("size_label"),
        supabase.from("reviews").select("*").eq("product_id", id).eq("status", "approved").order("created_at", { ascending: false }),
      ]);

      setProduct(prodRes.data);
      setImages(imgRes.data || []);
      setSizes(sizeRes.data || []);

      // Reviewer names
      const customerIds = [...new Set((revRes.data || []).map((r: any) => r.customer_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (customerIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", customerIds);
        (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p.name; });
      }
      setReviews((revRes.data || []).map((r: any) => ({ ...r, customerName: profilesMap[r.customer_id] || "Anonymous" })));

      // Check if user already reviewed
      if (user) {
        const { data: existingReview } = await supabase.from("reviews").select("id").eq("product_id", id).eq("customer_id", user.id).maybeSingle();
        setHasReviewed(!!existingReview);
      }

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

  const submitReview = async () => {
    if (!user) { toast({ title: t("product.signinToReview"), variant: "destructive" }); return; }
    if (hasReviewed) { toast({ title: t("product.alreadyReviewed"), variant: "destructive" }); return; }
    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({
      product_id: id!,
      customer_id: user.id,
      rating: reviewRating,
      comment: null,
    });
    if (error) {
      const msg = error.message.includes("unique") ? t("product.alreadyReviewed") : error.message;
      toast({ title: t("common.error"), description: msg, variant: "destructive" });
      setSubmittingReview(false);
      return;
    }
    toast({ title: t("product.reviewSubmitted") });
    setHasReviewed(true);
    setSubmittingReview(false);
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
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
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-warning text-warning" : "text-border"}`} />)}</div>
              <span className="text-sm text-muted-foreground">({reviews.length})</span>
            </div>
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

      {/* Reviews */}
      <div className="mt-16">
        <h2 className="text-xl font-bold text-foreground mb-6">{t("product.reviews")} ({reviews.length})</h2>

        {/* Stars display */}
        <div className="flex items-center gap-4 mb-8 p-5 rounded-xl border bg-card">
          <div className="text-center">
            <p className="text-4xl font-bold text-foreground">{avgRating.toFixed(1)}</p>
            <div className="flex mt-1">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-warning text-warning" : "text-border"}`} />)}</div>
            <p className="text-xs text-muted-foreground mt-1">{reviews.length} ratings</p>
          </div>
          <div className="flex-1 space-y-1.5 ms-4">
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviews.filter(r => r.rating === star).length;
              const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 text-sm">
                  <span className="w-3 text-muted-foreground">{star}</span>
                  <Star className="h-3 w-3 fill-warning text-warning" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-warning rounded-full transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-8 text-xs text-muted-foreground text-end">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit rating (stars only) */}
        {user && !hasReviewed && (
          <div className="p-5 rounded-xl border bg-card mb-8">
            <h3 className="font-semibold text-foreground mb-3">{t("product.leaveReview")}</h3>
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setReviewRating(i + 1)}>
                  <Star className={`h-7 w-7 cursor-pointer transition-colors ${i < reviewRating ? "fill-warning text-warning" : "text-border hover:text-warning/50"}`} />
                </button>
              ))}
            </div>
            <Button onClick={submitReview} disabled={submittingReview} size="sm">
              {submittingReview ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
              {t("product.submitReview")}
            </Button>
          </div>
        )}
        {user && hasReviewed && (
          <p className="text-sm text-muted-foreground mb-8 p-4 rounded-xl border bg-card">{t("product.alreadyReviewed")}</p>
        )}
        {!user && (
          <p className="text-sm text-muted-foreground mb-8 p-4 rounded-xl border bg-card">{t("product.signinToReview")}</p>
        )}
      </div>

      {/* Related */}
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

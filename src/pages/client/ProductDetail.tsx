import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Star, Heart, ShoppingCart, Loader2, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetch = async () => {
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

      // Fetch reviewer names
      const customerIds = [...new Set((revRes.data || []).map((r: any) => r.customer_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (customerIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", customerIds);
        (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p.name; });
      }
      setReviews((revRes.data || []).map((r: any) => ({ ...r, customerName: profilesMap[r.customer_id] || "Anonymous" })));

      // Related products
      if (prodRes.data?.category_id) {
        const { data: rel } = await supabase.from("products").select("*, product_images(image_url, is_primary)").eq("category_id", prodRes.data.category_id).neq("id", id).eq("status", "active").limit(4);
        setRelated(rel || []);
      }

      // Check favorite
      if (user) {
        const { data: fav } = await supabase.from("favorites").select("id").eq("user_id", user.id).eq("product_id", id).maybeSingle();
        setIsFav(!!fav);
      }

      setLoading(false);
    };
    fetch();
  }, [id, user]);

  const toggleFav = async () => {
    if (!user) { toast({ title: "Please sign in to add favorites", variant: "destructive" }); return; }
    if (isFav) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", id!);
      setIsFav(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: id! });
      setIsFav(true);
    }
  };

  const addToCart = async () => {
    if (!user) { toast({ title: "Please sign in to add to cart", variant: "destructive" }); return; }
    if (sizes.length > 0 && !selectedSize) { toast({ title: "Please select a size", variant: "destructive" }); return; }
    const { error } = await supabase.from("cart_items").insert({ user_id: user.id, product_id: id!, size_id: selectedSize, quantity });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Added to cart!" });
    queryClient.invalidateQueries({ queryKey: ["cart-count"] });
  };

  const submitReview = async () => {
    if (!user) { toast({ title: "Please sign in to leave a review", variant: "destructive" }); return; }
    setSubmittingReview(true);
    const { error } = await supabase.from("reviews").insert({ product_id: id!, customer_id: user.id, rating: reviewRating, comment: reviewComment || null });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSubmittingReview(false); return; }
    toast({ title: "Review submitted! It will appear after approval." });
    setReviewComment("");
    setReviewRating(5);
    setSubmittingReview(false);
  };

  const getImage = (p: any) => {
    const primary = p.product_images?.find((i: any) => i.is_primary);
    return primary?.image_url || p.product_images?.[0]?.image_url || "/placeholder.svg";
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const price = product?.discount_price || product?.price || 0;
  const sizeExtra = sizes.find(s => s.id === selectedSize)?.extra_price || 0;

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!product) return <div className="text-center py-20 text-muted-foreground">Product not found</div>;

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
                <button key={img.id} onClick={() => setSelectedImage(i)} className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${i === selectedImage ? "border-primary" : "border-transparent"}`}>
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
            <h1 className="text-3xl font-bold text-foreground mt-1">{product.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-warning text-warning" : "text-border"}`} />)}</div>
              <span className="text-sm text-muted-foreground">({reviews.length} reviews)</span>
            </div>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">${(Number(price) + Number(sizeExtra)).toFixed(2)}</span>
            {product.discount_price && <span className="text-lg text-muted-foreground line-through">${Number(product.price).toFixed(2)}</span>}
          </div>

          {product.description && <p className="text-muted-foreground">{product.description}</p>}

          {/* Sizes */}
          {sizes.length > 0 && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2">Size</p>
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
                    {s.stock <= 0 && <span className="block text-xs">Out of stock</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-foreground">Quantity</p>
            <div className="flex items-center border rounded-lg">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2"><Minus className="h-4 w-4" /></button>
              <span className="px-4 text-sm font-medium">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2"><Plus className="h-4 w-4" /></button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button className="flex-1" onClick={addToCart}>
              <ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart
            </Button>
            <Button variant="outline" size="icon" onClick={toggleFav}>
              <Heart className={`h-5 w-5 ${isFav ? "fill-destructive text-destructive" : ""}`} />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Reviews */}
      <div className="mt-16">
        <h2 className="text-2xl font-bold text-foreground mb-6">Reviews</h2>
        <div className="space-y-4 mb-8">
          {reviews.map(r => (
            <div key={r.id} className="p-4 rounded-xl border bg-card">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{r.customerName}</span>
                <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex mb-2">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-warning text-warning" : "text-border"}`} />)}</div>
              {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            </div>
          ))}
          {reviews.length === 0 && <p className="text-muted-foreground">No reviews yet. Be the first!</p>}
        </div>

        {/* Submit review */}
        {user && (
          <div className="p-6 rounded-xl border bg-card">
            <h3 className="font-semibold text-foreground mb-4">Leave a Review</h3>
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <button key={i} onClick={() => setReviewRating(i + 1)}>
                  <Star className={`h-6 w-6 cursor-pointer ${i < reviewRating ? "fill-warning text-warning" : "text-border"}`} />
                </button>
              ))}
            </div>
            <Textarea placeholder="Write your review (optional)..." value={reviewComment} onChange={e => setReviewComment(e.target.value)} className="mb-4" />
            <Button onClick={submitReview} disabled={submittingReview}>{submittingReview ? "Submitting..." : "Submit Review"}</Button>
          </div>
        )}
      </div>

      {/* Related */}
      {related.length > 0 && (
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-6">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {related.map(p => (
              <Link key={p.id} to={`/product/${p.id}`} className="group block">
                <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                  <img src={getImage(p)} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h4 className="text-sm font-medium text-foreground truncate">{p.name}</h4>
                <span className="text-sm font-bold text-primary">${Number(p.discount_price || p.price).toFixed(2)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;

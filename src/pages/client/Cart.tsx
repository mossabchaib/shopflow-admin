import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Minus, Plus, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useGuestCart, getGuestCartItems, clearGuestCart } from "@/hooks/useGuestCart";
import { useI18n } from "@/lib/i18n";

const Cart = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const guestCart = useGuestCart();
  const [dbItems, setDbItems] = useState<any[]>([]);
  const [guestProducts, setGuestProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Merge guest cart into DB on login
  useEffect(() => {
    if (!user) return;
    const mergeGuestCart = async () => {
      const guestItems = getGuestCartItems();
      if (guestItems.length === 0) return;
      for (const item of guestItems) {
        await supabase.from("cart_items").insert({
          user_id: user.id,
          product_id: item.product_id,
          size_id: item.size_id,
          color_id: (item as any).color_id || null,
          quantity: item.quantity,
        });
      }
      clearGuestCart();
      queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    };
    mergeGuestCart();
  }, [user]);

  // Fetch DB cart for logged-in users
  useEffect(() => {
    const fetchDbCart = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("cart_items")
        .select("*, products(id, name, price, discount_price, product_images(image_url, is_primary)), product_sizes(size_label, extra_price), product_colors(color_name, color_hex)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setDbItems(data || []);
      setLoading(false);
    };
    fetchDbCart();
  }, [user]);

  // Fetch product details for guest cart items
  useEffect(() => {
    if (user || guestCart.items.length === 0) { if (!user) setLoading(false); return; }
    const fetchGuestProducts = async () => {
      const ids = guestCart.items.map(i => i.product_id);
      const { data } = await supabase
        .from("products")
        .select("id, name, price, discount_price, product_images(image_url, is_primary)")
        .in("id", ids);
      setGuestProducts(data || []);
      setLoading(false);
    };
    fetchGuestProducts();
  }, [user, guestCart.items]);

  const getImage = (p: any) => {
    const primary = p?.product_images?.find((i: any) => i.is_primary);
    return primary?.image_url || p?.product_images?.[0]?.image_url || "/placeholder.svg";
  };

  // For logged-in users
  const updateDbQty = async (id: string, qty: number) => {
    if (qty < 1) return;
    await supabase.from("cart_items").update({ quantity: qty }).eq("id", id);
    setDbItems(dbItems.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const removeDbItem = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    setDbItems(dbItems.filter(i => i.id !== id));
    queryClient.invalidateQueries({ queryKey: ["cart-count"] });
  };

  const getDbItemPrice = (item: any) => {
    const base = Number(item.products?.discount_price || item.products?.price || 0);
    const extra = Number(item.product_sizes?.extra_price || 0);
    return (base + extra) * item.quantity;
  };

  // For guests
  const getGuestItemPrice = (gItem: any) => {
    const prod = guestProducts.find(p => p.id === gItem.product_id);
    if (!prod) return 0;
    return Number(prod.discount_price || prod.price || 0) * gItem.quantity;
  };

  const isGuest = !user;
  const items = isGuest ? guestCart.items : dbItems;
  const total = isGuest
    ? guestCart.items.reduce((s, i) => s + getGuestItemPrice(i), 0)
    : dbItems.reduce((s, i) => s + getDbItemPrice(i), 0);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">{t("cart.title")}</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{t("cart.empty")}</p>
          <Button asChild><Link to="/shop">{t("cart.continueShopping")}</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {isGuest ? (
              guestCart.items.map((gItem, i) => {
                const prod = guestProducts.find(p => p.id === gItem.product_id);
                if (!prod) return null;
                return (
                  <motion.div key={`${gItem.product_id}-${gItem.size_id}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-4 p-4 rounded-xl border bg-card">
                    <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      <img src={getImage(prod)} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link to={`/product/${prod.id}`} className="font-medium text-foreground hover:text-primary truncate block">{prod.name}</Link>
                      <p className="text-sm font-bold text-success mt-1">${getGuestItemPrice(gItem).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center border rounded-lg">
                        <button onClick={() => guestCart.updateQuantity(gItem.product_id, gItem.size_id, gItem.quantity - 1)} className="p-1.5"><Minus className="h-3 w-3" /></button>
                        <span className="px-2 text-sm">{gItem.quantity}</span>
                        <button onClick={() => guestCart.updateQuantity(gItem.product_id, gItem.size_id, gItem.quantity + 1)} className="p-1.5"><Plus className="h-3 w-3" /></button>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => guestCart.removeItem(gItem.product_id, gItem.size_id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              dbItems.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-4 p-4 rounded-xl border bg-card">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img src={getImage(item.products)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/product/${item.products?.id}`} className="font-medium text-foreground hover:text-primary truncate block">{item.products?.name}</Link>
                    {item.product_sizes && <p className="text-xs text-muted-foreground">{t("product.size")}: {item.product_sizes.size_label}</p>}
                    {(item as any).product_colors && <p className="text-xs text-muted-foreground flex items-center gap-1">Color: <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: (item as any).product_colors.color_hex }} /> {(item as any).product_colors.color_name}</p>}
                    <p className="text-sm font-bold text-primary mt-1">${getDbItemPrice(item).toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center border rounded-lg">
                      <button onClick={() => updateDbQty(item.id, item.quantity - 1)} className="p-1.5"><Minus className="h-3 w-3" /></button>
                      <span className="px-2 text-sm">{item.quantity}</span>
                      <button onClick={() => updateDbQty(item.id, item.quantity + 1)} className="p-1.5"><Plus className="h-3 w-3" /></button>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeDbItem(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <div className="p-6 rounded-xl border bg-card h-fit sticky top-20">
            <h3 className="font-semibold text-foreground mb-4">{t("cart.orderSummary")}</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("cart.subtotal")}</span><span className="font-medium">${total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("cart.shipping")}</span><span className="text-muted-foreground">{t("cart.shippingCalc")}</span></div>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-4 mb-6">
              <span>{t("cart.total")}</span><span className="text-primary">${total.toFixed(2)}</span>
            </div>
            <Button className="w-full" onClick={() => {
              if (!user) {
                toast({ title: t("checkout.signinRequired"), variant: "destructive" });
                navigate("/auth");
                return;
              }
              navigate("/checkout");
            }}>
              {t("cart.checkout")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;

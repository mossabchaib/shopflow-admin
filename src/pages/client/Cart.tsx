import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Minus, Plus, Loader2, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

const Cart = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("cart_items")
      .select("*, products(id, name, price, discount_price, product_images(image_url, is_primary)), product_sizes(size_label, extra_price)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCart(); }, [user]);

  const updateQty = async (id: string, qty: number) => {
    if (qty < 1) return;
    await supabase.from("cart_items").update({ quantity: qty }).eq("id", id);
    setItems(items.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const remove = async (id: string) => {
    await supabase.from("cart_items").delete().eq("id", id);
    setItems(items.filter(i => i.id !== id));
    queryClient.invalidateQueries({ queryKey: ["cart-count"] });
  };

  const getImage = (p: any) => {
    const primary = p?.product_images?.find((i: any) => i.is_primary);
    return primary?.image_url || p?.product_images?.[0]?.image_url || "/placeholder.svg";
  };

  const getPrice = (item: any) => {
    const base = Number(item.products?.discount_price || item.products?.price || 0);
    const extra = Number(item.product_sizes?.extra_price || 0);
    return (base + extra) * item.quantity;
  };

  const total = items.reduce((s, i) => s + getPrice(i), 0);

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to view your cart</h2>
      <Button onClick={() => navigate("/auth")}>Sign In</Button>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">Shopping Cart</h1>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <ShoppingCart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">Your cart is empty</p>
          <Button asChild><Link to="/shop">Continue Shopping</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="flex gap-4 p-4 rounded-xl border bg-card">
                <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  <img src={getImage(item.products)} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/product/${item.products?.id}`} className="font-medium text-foreground hover:text-primary truncate block">{item.products?.name}</Link>
                  {item.product_sizes && <p className="text-xs text-muted-foreground">Size: {item.product_sizes.size_label}</p>}
                  <p className="text-sm font-bold text-primary mt-1">${getPrice(item).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => updateQty(item.id, item.quantity - 1)} className="p-1.5"><Minus className="h-3 w-3" /></button>
                    <span className="px-2 text-sm">{item.quantity}</span>
                    <button onClick={() => updateQty(item.id, item.quantity + 1)} className="p-1.5"><Plus className="h-3 w-3" /></button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="p-6 rounded-xl border bg-card h-fit sticky top-20">
            <h3 className="font-semibold text-foreground mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm mb-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-medium">${total.toFixed(2)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span className="text-muted-foreground">Calculated at checkout</span></div>
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-4 mb-6">
              <span>Total</span><span className="text-primary">${total.toFixed(2)}</span>
            </div>
            <Button className="w-full" onClick={() => navigate("/checkout")}>Proceed to Checkout</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;

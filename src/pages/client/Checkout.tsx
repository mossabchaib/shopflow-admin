import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { useI18n } from "@/lib/i18n";

const Checkout = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t } = useI18n();
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("credit_card");
  const [address, setAddress] = useState({ full_name: "", phone: "", street: "", city: "", state: "", postal_code: "", country: "" });
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!user) { navigate("/auth"); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("cart_items")
        .select("*, products(id, name, price, discount_price), product_sizes(id, size_label, extra_price, stock), product_colors(id, color_name, color_hex, stock)")
        .eq("user_id", user.id);
      setCartItems(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const getItemPrice = (item: any) => {
    const base = Number(item.products?.discount_price || item.products?.price || 0);
    const extra = Number(item.product_sizes?.extra_price || 0);
    return (base + extra) * item.quantity;
  };

  const subtotal = cartItems.reduce((s, i) => s + getItemPrice(i), 0);
  const discountAmount = appliedCoupon
    ? appliedCoupon.discount_type === "percentage"
      ? (subtotal * Number(appliedCoupon.discount_value)) / 100
      : Number(appliedCoupon.discount_value)
    : 0;
  const total = Math.max(0, subtotal - discountAmount);

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setApplyingCoupon(true);
    const { data, error } = await supabase.from("coupons").select("*").eq("code", couponCode.trim().toUpperCase()).eq("is_active", true).maybeSingle();
    if (error || !data) { toast({ title: "Invalid coupon code", variant: "destructive" }); setApplyingCoupon(false); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { toast({ title: "Coupon has expired", variant: "destructive" }); setApplyingCoupon(false); return; }
    if (data.usage_limit && (data.usage_count || 0) >= data.usage_limit) { toast({ title: "Coupon usage limit reached", variant: "destructive" }); setApplyingCoupon(false); return; }
    if (data.min_order_value && subtotal < Number(data.min_order_value)) { toast({ title: `Minimum order value: $${Number(data.min_order_value).toFixed(2)}`, variant: "destructive" }); setApplyingCoupon(false); return; }
    setAppliedCoupon(data);
    toast({ title: "Coupon applied!" });
    setApplyingCoupon(false);
  };

  const placeOrder = async () => {
    if (!address.full_name || !address.street || !address.city || !address.country) {
      toast({ title: t("checkout.shippingAddress"), description: "Please fill in required fields", variant: "destructive" });
      return;
    }
    setSubmitting(true);

    const { data: addrData, error: addrErr } = await supabase.from("addresses").insert({ ...address, user_id: user!.id }).select("id").single();
    if (addrErr) { toast({ title: t("common.error"), description: addrErr.message, variant: "destructive" }); setSubmitting(false); return; }

    const { data: orderData, error: orderErr } = await supabase.from("orders").insert({
      customer_id: user!.id,
      address_id: addrData.id,
      payment_method: paymentMethod as any,
      subtotal,
      discount_amount: discountAmount,
      total,
      coupon_id: appliedCoupon?.id || null,
      notes: notes || null,
    }).select("id").single();

    if (orderErr) { toast({ title: t("common.error"), description: orderErr.message, variant: "destructive" }); setSubmitting(false); return; }

    for (const item of cartItems) {
      await supabase.from("order_items").insert({
        order_id: orderData.id,
        product_id: item.products?.id,
        size_id: item.product_sizes?.id || null,
        quantity: item.quantity,
        unit_price: Number(item.products?.discount_price || item.products?.price || 0) + Number(item.product_sizes?.extra_price || 0),
        total_price: getItemPrice(item),
      });
      if (item.product_sizes?.id) {
        const newStock = Math.max(0, (item.product_sizes.stock || 0) - item.quantity);
        await supabase.from("product_sizes").update({ stock: newStock }).eq("id", item.product_sizes.id);
      }
    }

    if (appliedCoupon) {
      await supabase.from("coupons").update({ usage_count: (appliedCoupon.usage_count || 0) + 1 }).eq("id", appliedCoupon.id);
    }

    await supabase.from("cart_items").delete().eq("user_id", user!.id);
    queryClient.invalidateQueries({ queryKey: ["cart-count"] });
    setSuccess(true);
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (success) return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-lg mx-auto px-4 py-20 text-center">
      <CheckCircle className="h-20 w-20 text-success mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-foreground mb-2">{t("checkout.orderPlaced")}</h1>
      <p className="text-muted-foreground mb-8">{t("checkout.orderThanks")}</p>
      <Button onClick={() => navigate("/shop")}>{t("cart.continueShopping")}</Button>
    </motion.div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-8">{t("checkout.title")}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-xl border bg-card">
            <h2 className="font-semibold text-foreground mb-4">{t("checkout.shippingAddress")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>{t("checkout.fullName")} *</Label><Input value={address.full_name} onChange={e => setAddress({ ...address, full_name: e.target.value })} className="mt-1" /></div>
              <div><Label>{t("checkout.phone")}</Label><Input value={address.phone} onChange={e => setAddress({ ...address, phone: e.target.value })} className="mt-1" /></div>
              <div className="sm:col-span-2"><Label>{t("checkout.street")} *</Label><Input value={address.street} onChange={e => setAddress({ ...address, street: e.target.value })} className="mt-1" /></div>
              <div><Label>{t("checkout.city")} *</Label><Input value={address.city} onChange={e => setAddress({ ...address, city: e.target.value })} className="mt-1" /></div>
              <div><Label>{t("checkout.state")}</Label><Input value={address.state} onChange={e => setAddress({ ...address, state: e.target.value })} className="mt-1" /></div>
              <div><Label>{t("checkout.postalCode")}</Label><Input value={address.postal_code} onChange={e => setAddress({ ...address, postal_code: e.target.value })} className="mt-1" /></div>
              <div><Label>{t("checkout.country")} *</Label><Input value={address.country} onChange={e => setAddress({ ...address, country: e.target.value })} className="mt-1" /></div>
            </div>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <h2 className="font-semibold text-foreground mb-4">{t("checkout.paymentMethod")}</h2>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">{t("checkout.creditCard")}</SelectItem>
                <SelectItem value="paypal">{t("checkout.paypal")}</SelectItem>
                <SelectItem value="cash_on_delivery">{t("checkout.cod")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-6 rounded-xl border bg-card">
            <h2 className="font-semibold text-foreground mb-4">{t("checkout.orderNotes")}</h2>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="..." />
          </div>
        </div>

        <div className="p-6 rounded-xl border bg-card h-fit sticky top-20">
          <h3 className="font-semibold text-foreground mb-4">{t("cart.orderSummary")}</h3>
          <div className="space-y-3 mb-4">
            {cartItems.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[60%]">{item.products?.name} × {item.quantity}</span>
                <span className="font-medium">${getItemPrice(item).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Tag className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder={t("checkout.couponCode")} className="ps-9" value={couponCode} onChange={e => setCouponCode(e.target.value)} />
            </div>
            <Button variant="outline" size="sm" onClick={applyCoupon} disabled={applyingCoupon}>{t("checkout.apply")}</Button>
          </div>
          {appliedCoupon && (
            <p className="text-xs text-success mb-4">
              ✓ {appliedCoupon.code}: {appliedCoupon.discount_type === "percentage" ? `${appliedCoupon.discount_value}% off` : `$${Number(appliedCoupon.discount_value).toFixed(2)} off`}
            </p>
          )}

          <div className="space-y-2 text-sm border-t pt-4">
            <div className="flex justify-between"><span className="text-muted-foreground">{t("cart.subtotal")}</span><span>${subtotal.toFixed(2)}</span></div>
            {discountAmount > 0 && <div className="flex justify-between text-success"><span>{t("checkout.discount")}</span><span>-${discountAmount.toFixed(2)}</span></div>}
          </div>
          <div className="flex justify-between font-semibold text-lg border-t pt-4 mt-4 mb-6">
            <span>{t("cart.total")}</span><span className="text-primary">${total.toFixed(2)}</span>
          </div>
          <Button className="w-full" onClick={placeOrder} disabled={submitting || cartItems.length === 0}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
            {t("checkout.placeOrder")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

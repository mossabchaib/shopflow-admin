import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Package, Loader2, Filter, ShoppingCart, RotateCcw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { useNavigate } from "react-router-dom";
import { OrderTracking } from "@/components/OrderTracking";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const MyOrders = () => {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*, products(id, name, price, product_images(image_url, is_primary))), addresses(*)")
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });
      setOrders(data || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const filtered = orders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || (o.order_items || []).some((i: any) => i.products?.name?.toLowerCase().includes(search.toLowerCase()));
    const matchStatus = statusFilter === "all" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const reorder = async (order: any) => {
    if (!user) return;
    for (const item of order.order_items || []) {
      if (item.products?.id) {
        await supabase.from("cart_items").insert({ user_id: user.id, product_id: item.products.id, quantity: item.quantity, size_id: item.size_id || null, color_id: item.color_id || null });
      }
    }
    navigate("/cart");
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">{t("orders.myOrders")}</h1>
        <p className="text-muted-foreground mb-6">{filtered.length} {t("orders.ordersFound")}</p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t("orders.searchOrders")} className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("admin.all")}</SelectItem>
              {["pending", "paid", "shipped", "delivered", "cancelled"].map(s => (
                <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">{t("orders.noOrders")}</p>
              <Button onClick={() => navigate("/shop")}>{t("account.shopNow")}</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((order) => (
              <Card key={order.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader
                  className="pb-3 cursor-pointer"
                  onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-mono font-medium text-foreground">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <Badge variant="secondary" className={statusColors[order.status] || ""}>{order.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground">{(order.order_items || []).length} {t("orders.items")}</span>
                      <span className="font-bold text-foreground">${Number(order.total).toFixed(2)}</span>
                    </div>
                  </div>
                </CardHeader>

                {expandedOrder === order.id && (
                  <CardContent className="border-t pt-4">
                    <OrderTracking orderId={order.id} currentStatus={order.status} />

                    <div className="space-y-3 mt-4">
                      {(order.order_items || []).map((item: any) => {
                        const img = item.products?.product_images?.find((i: any) => i.is_primary)?.image_url || item.products?.product_images?.[0]?.image_url;
                        return (
                          <div key={item.id} className="flex items-center gap-3">
                            {img ? (
                              <img src={img} alt="" className="h-14 w-14 rounded-lg object-cover border" />
                            ) : (
                              <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">{item.products?.name || "Product"}</p>
                              <p className="text-xs text-muted-foreground">x{item.quantity} · ${Number(item.unit_price).toFixed(2)}</p>
                            </div>
                            <p className="text-sm font-semibold text-success">${Number(item.total_price).toFixed(2)}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* Order Summary */}
                    <div className="mt-4 pt-4 border-t space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">{t("cart.subtotal")}</span><span>${Number(order.subtotal).toFixed(2)}</span></div>
                      {order.discount_amount > 0 && <div className="flex justify-between text-destructive"><span>{t("checkout.discount")}</span><span>-${Number(order.discount_amount).toFixed(2)}</span></div>}
                      <div className="flex justify-between font-semibold border-t pt-2"><span>{t("cart.total")}</span><span className="text-success">${Number(order.total).toFixed(2)}</span></div>
                    </div>

                    {/* Address */}
                    {order.addresses && (
                      <div className="mt-4 p-3 rounded-lg bg-muted/30 border text-sm">
                        <p className="font-medium text-foreground">{order.addresses.full_name}</p>
                        <p className="text-muted-foreground">{[order.addresses.street, order.addresses.city, order.addresses.country].filter(Boolean).join(", ")}</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      {order.status === "delivered" && (
                        <Button size="sm" variant="outline" onClick={() => reorder(order)}>
                          <RotateCcw className="h-3.5 w-3.5 me-1.5" />{t("orders.reorder")}
                        </Button>
                      )}
                      {order.status === "delivered" && (
                        <Button size="sm" variant="outline" onClick={() => navigate("/returns")}>
                          {t("orders.requestReturn")}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MyOrders;

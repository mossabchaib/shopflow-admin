import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DollarSign, ShoppingCart, Package, TrendingUp, Star, Loader2, AlertTriangle, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";
import { useNavigate } from "react-router-dom";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const SellerDashboard = () => {
  const { user } = useAuth();
  const { store, isLoading: storeLoading } = useUserStore();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, commissionPaid: 0, netEarnings: 0, totalOrders: 0, totalProducts: 0, avgRating: 0, lowStock: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => {
    if (!store) return;
    const fetchData = async () => {
      setLoading(true);

      // Get store products
      const { data: products } = await supabase.from("products").select("id, name, stock, price").eq("store_id", store.id).eq("status", "active");
      const productIds = (products || []).map((p: any) => p.id);
      const lowStock = (products || []).filter((p: any) => (p.stock || 0) <= 5);
      setLowStockProducts(lowStock);

      // Get orders for store products
      let orders: any[] = [];
      let totalRevenue = 0;
      if (productIds.length > 0) {
        const { data: orderItems } = await supabase.from("order_items").select("*, orders(id, status, total, created_at, customer_id, guest_name, payment_method), products(name)").in("product_id", productIds).order("created_at", { ascending: false });
        
        // Group by order
        const orderMap = new Map<string, any>();
        (orderItems || []).forEach((oi: any) => {
          if (!oi.orders) return;
          const existing = orderMap.get(oi.orders.id);
          if (existing) {
            existing.items.push(oi);
            existing.storeTotal += Number(oi.total_price);
          } else {
            orderMap.set(oi.orders.id, { ...oi.orders, items: [oi], storeTotal: Number(oi.total_price) });
          }
        });
        orders = Array.from(orderMap.values()).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.storeTotal, 0);
      }

      // Get commissions
      const { data: commissions } = await supabase.from("commissions").select("commission_amount, seller_amount").eq("store_id", store.id);
      const totalCommission = (commissions || []).reduce((s: number, c: any) => s + Number(c.commission_amount), 0);
      const totalNet = (commissions || []).reduce((s: number, c: any) => s + Number(c.seller_amount), 0);

      // Get store rating
      const { data: reviews } = await supabase.from("store_reviews").select("rating").eq("store_id", store.id);
      const avgRating = (reviews || []).length > 0 ? (reviews || []).reduce((s: number, r: any) => s + r.rating, 0) / reviews!.length : 0;

      setStats({
        revenue: totalRevenue,
        commissionPaid: totalCommission,
        netEarnings: totalNet > 0 ? totalNet : totalRevenue - totalCommission,
        totalOrders: orders.length,
        totalProducts: (products || []).length,
        avgRating,
        lowStock: lowStock.length,
      });
      setRecentOrders(orders.slice(0, 10));
      setLoading(false);
    };
    fetchData();
  }, [store]);

  if (storeLoading || loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!store) return <div className="text-center py-20 text-muted-foreground">{t("seller.noStore")}</div>;

  const statCards = [
    { label: t("seller.totalRevenue"), value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: "bg-success/10 text-success" },
    { label: t("seller.netEarnings"), value: `$${stats.netEarnings.toFixed(2)}`, icon: TrendingUp, color: "bg-primary/10 text-primary" },
    { label: t("seller.totalOrders"), value: String(stats.totalOrders), icon: ShoppingCart, color: "bg-blue-500/10 text-blue-500" },
    { label: t("seller.storeRating"), value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—", icon: Star, color: "bg-amber-500/10 text-amber-500" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{store.store_name}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("seller.dashboardOverview")}</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/store/${store.slug}`)}>{t("seller.viewStore")}</Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Commission info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{t("seller.commissionRate")}: 10%</p>
            <p className="text-xs text-muted-foreground">{t("seller.commissionPaid")}: ${stats.commissionPaid.toFixed(2)}</p>
          </div>
          <DollarSign className="h-8 w-8 text-primary/30" />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{t("seller.recentOrders")}</CardTitle>
            </CardHeader>
            <CardContent>
              {recentOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">{t("seller.noOrders")}</p>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map((order) => (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div>
                          <p className="text-sm font-mono text-foreground">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-success">${order.storeTotal.toFixed(2)}</span>
                        <Badge variant="secondary" className={`text-xs ${statusColors[order.status] || ""}`}>{order.status}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              {t("seller.lowStock")} ({stats.lowStock})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">{t("seller.allStocked")}</p>
            ) : (
              <div className="space-y-2">
                {lowStockProducts.slice(0, 8).map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/10">
                    <p className="text-sm text-foreground truncate flex-1">{p.name}</p>
                    <Badge variant="destructive" className="text-xs">{p.stock || 0}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Order Detail Modal */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("admin.orderDetails")}</DialogTitle></DialogHeader>
          {selectedOrder && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("admin.orderId")}</span>
                  <p className="font-mono">{selectedOrder.id.slice(0, 12)}...</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("admin.status")}</span>
                  <p><Badge variant="secondary" className={statusColors[selectedOrder.status] || ""}>{selectedOrder.status}</Badge></p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("admin.date")}</span>
                  <p>{new Date(selectedOrder.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("seller.storeRevenue")}</span>
                  <p className="font-semibold text-success">${selectedOrder.storeTotal.toFixed(2)}</p>
                </div>
              </div>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-muted/50"><th className="text-start p-2 text-xs">{t("admin.item")}</th><th className="text-start p-2 text-xs">{t("admin.qty")}</th><th className="text-start p-2 text-xs">{t("admin.price")}</th></tr></thead>
                  <tbody>
                    {selectedOrder.items.map((item: any) => (
                      <tr key={item.id} className="border-t">
                        <td className="p-2 text-sm">{item.products?.name || "—"}</td>
                        <td className="p-2 text-sm">{item.quantity}</td>
                        <td className="p-2 text-sm text-success">${Number(item.total_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerDashboard;

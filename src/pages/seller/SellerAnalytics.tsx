import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart3, TrendingUp, Package, DollarSign, Loader2, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/hooks/useStore";
import { useI18n } from "@/lib/i18n";

const COLORS = ["hsl(189, 94%, 43%)", "hsl(224, 76%, 33%)", "hsl(142, 76%, 36%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(270, 76%, 50%)"];

const SellerAnalytics = () => {
  const { user } = useAuth();
  const { store, isLoading: storeLoading } = useUserStore();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);

  useEffect(() => {
    if (!store) return;
    const fetch = async () => {
      setLoading(true);
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - Number(period));

      const { data: prods } = await supabase.from("products").select("id, name, stock, price").eq("store_id", store.id).eq("status", "active");
      setProducts(prods || []);
      const productIds = (prods || []).map((p: any) => p.id);

      if (productIds.length > 0) {
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("*, orders(id, status, total, created_at, customer_id)")
          .in("product_id", productIds)
          .gte("orders.created_at", daysAgo.toISOString());

        const orderMap = new Map<string, any>();
        (orderItems || []).forEach((oi: any) => {
          if (!oi.orders) return;
          const ex = orderMap.get(oi.orders.id);
          if (ex) { ex.items.push(oi); ex.storeTotal += Number(oi.total_price); }
          else orderMap.set(oi.orders.id, { ...oi.orders, items: [oi], storeTotal: Number(oi.total_price) });
        });
        setOrders(Array.from(orderMap.values()));
      } else {
        setOrders([]);
      }

      const { data: comms } = await supabase.from("commissions").select("*").eq("store_id", store.id);
      setCommissions(comms || []);
      setLoading(false);
    };
    fetch();
  }, [store, period]);

  // Daily revenue chart
  const dailyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    const days = Number(period);
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }
    orders.filter(o => o.status !== "cancelled").forEach(o => {
      const day = new Date(o.created_at).toISOString().slice(0, 10);
      map.set(day, (map.get(day) || 0) + o.storeTotal);
    });
    return Array.from(map.entries()).map(([date, revenue]) => ({
      date: date.slice(5), // MM-DD
      revenue: Math.round(revenue * 100) / 100,
    }));
  }, [orders, period]);

  // Top selling products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; sold: number; revenue: number }>();
    orders.forEach(o => {
      o.items.forEach((item: any) => {
        const pid = item.product_id;
        const prod = products.find(p => p.id === pid);
        const ex = map.get(pid) || { name: prod?.name || "Unknown", sold: 0, revenue: 0 };
        ex.sold += item.quantity;
        ex.revenue += Number(item.total_price);
        map.set(pid, ex);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [orders, products]);

  // Order status distribution
  const statusDist = useMemo(() => {
    const map: Record<string, number> = {};
    orders.forEach(o => { map[o.status] = (map[o.status] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Summary stats
  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((s, o) => s + o.storeTotal, 0);
  const totalCommission = commissions.reduce((s, c) => s + Number(c.commission_amount), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.filter(o => o.status !== "cancelled").length : 0;

  if (storeLoading || loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!store) return <div className="text-center py-20 text-muted-foreground">{t("seller.noStore")}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("seller.analytics")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("seller.analyticsDesc")}</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[140px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 {t("product.days")}</SelectItem>
            <SelectItem value="30">30 {t("product.days")}</SelectItem>
            <SelectItem value="90">90 {t("product.days")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t("seller.totalRevenue"), value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign, color: "bg-success/10 text-success" },
          { label: t("seller.totalOrders"), value: String(orders.length), icon: Package, color: "bg-primary/10 text-primary" },
          { label: t("seller.avgOrder"), value: `$${avgOrderValue.toFixed(2)}`, icon: TrendingUp, color: "bg-info/10 text-info" },
          { label: t("seller.commissionPaid"), value: `$${totalCommission.toFixed(2)}`, icon: BarChart3, color: "bg-warning/10 text-warning" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card>
              <CardContent className="p-5">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("seller.revenueChart")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <YAxis fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, t("seller.totalRevenue")]}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("seller.topProducts")}</CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">{t("admin.noSalesData")}</p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis type="number" fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis dataKey="name" type="category" width={100} fontSize={11} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, t("seller.totalRevenue")]}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("admin.ordersByStatus")}</CardTitle>
          </CardHeader>
          <CardContent>
            {statusDist.length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">{t("seller.noOrders")}</p>
            ) : (
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusDist} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                      {statusDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerAnalytics;

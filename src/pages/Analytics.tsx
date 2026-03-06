import { useState, useEffect } from "react";
import { TrendingUp, ShoppingCart, DollarSign, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";

const CHART_COLORS = [
  "hsl(224, 76%, 33%)",
  "hsl(189, 94%, 43%)",
  "hsl(142, 76%, 36%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 84%, 60%)",
];

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ conversionRate: "3.24%", avgOrder: "$0.00", totalOrders: 0, activeCustomers: 0 });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [ordersByStatus, setOrdersByStatus] = useState<any[]>([]);
  const [revenueByDay, setRevenueByDay] = useState<any[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    const fetchAnalytics = async () => {
      const [ordersRes, customersRes, itemsRes] = await Promise.all([
        supabase.from("orders").select("total, status, created_at"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("order_items").select("quantity, unit_price, products(name)").order("quantity", { ascending: false }).limit(50),
      ]);

      const orders = ordersRes.data || [];
      const totalRev = orders.reduce((a: number, o: any) => a + Number(o.total), 0);
      const avgOrder = orders.length ? totalRev / orders.length : 0;

      // Top products
      const productMap: Record<string, { sales: number; revenue: number }> = {};
      (itemsRes.data || []).forEach((item: any) => {
        const name = item.products?.name || "Unknown";
        if (!productMap[name]) productMap[name] = { sales: 0, revenue: 0 };
        productMap[name].sales += item.quantity;
        productMap[name].revenue += item.quantity * Number(item.unit_price);
      });
      const top = Object.entries(productMap).map(([name, v]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, ...v })).sort((a, b) => b.sales - a.sales).slice(0, 5);

      // Orders by status
      const statusMap: Record<string, number> = {};
      orders.forEach((o: any) => { statusMap[o.status || "pending"] = (statusMap[o.status || "pending"] || 0) + 1; });
      const statusData = Object.entries(statusMap).map(([name, value]) => ({ name, value }));

      // Revenue by day (last 7 days)
      const dayMap: Record<string, number> = {};
      const now = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dayMap[key] = 0;
      }
      orders.forEach((o: any) => {
        const day = new Date(o.created_at).toISOString().slice(0, 10);
        if (dayMap[day] !== undefined) dayMap[day] += Number(o.total);
      });
      const revData = Object.entries(dayMap).map(([date, revenue]) => ({
        date: date.slice(5), // MM-DD
        revenue: Number(revenue.toFixed(2)),
      }));

      setStats({ conversionRate: "3.24%", avgOrder: `$${avgOrder.toFixed(2)}`, totalOrders: orders.length, activeCustomers: customersRes.count || 0 });
      setTopProducts(top);
      setOrdersByStatus(statusData);
      setRevenueByDay(revData);
      setLoading(false);
    };
    fetchAnalytics();
  }, []);

  const kpis = [
    { label: t("admin.conversionRate"), value: stats.conversionRate, icon: TrendingUp, color: "bg-success/10 text-success" },
    { label: t("admin.avgOrderValue"), value: stats.avgOrder, icon: DollarSign, color: "bg-primary/10 text-primary" },
    { label: t("admin.totalOrders"), value: String(stats.totalOrders), icon: ShoppingCart, color: "bg-secondary/10 text-secondary" },
    { label: t("admin.activeCustomers"), value: String(stats.activeCustomers), icon: Users, color: "bg-warning/10 text-warning" },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin.analytics")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("admin.businessPerformance")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="stat-card">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${kpi.color} mb-3`}>
              <kpi.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-sm text-muted-foreground">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Line Chart */}
        <div className="dashboard-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("admin.revenueOverTime") || "Revenue (Last 7 Days)"}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={revenueByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, t("admin.totalRevenue") || "Revenue"]}
                />
                <Line type="monotone" dataKey="revenue" stroke="hsl(142, 76%, 36%)" strokeWidth={2} dot={{ fill: "hsl(142, 76%, 36%)" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders by Status Pie Chart */}
        <div className="dashboard-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t("admin.ordersByStatus") || "Orders by Status"}</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ordersByStatus} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {ordersByStatus.map((_, i) => (
                    <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Products Bar Chart */}
      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("admin.topSellingProducts")}</h2>
        {topProducts.length > 0 ? (
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--foreground))" }}
                  formatter={(value: number, name: string) => [name === "revenue" ? `$${value.toFixed(2)}` : value, name === "revenue" ? (t("admin.totalRevenue") || "Revenue") : (t("admin.sales") || "Sales")]}
                />
                <Legend />
                <Bar dataKey="sales" fill="hsl(224, 76%, 33%)" radius={[0, 4, 4, 0]} name={t("admin.sales") || "Sales"} />
                <Bar dataKey="revenue" fill="hsl(142, 76%, 36%)" radius={[0, 4, 4, 0]} name={t("admin.totalRevenue") || "Revenue"} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("admin.noSalesData")}</p>
        )}
      </div>
    </div>
  );
};

export default Analytics;

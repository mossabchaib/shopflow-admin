import { useState, useEffect } from "react";
import { TrendingUp, ShoppingCart, DollarSign, Users, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ conversionRate: "3.24%", avgOrder: "$0.00", totalOrders: 0, activeCustomers: 0 });
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const { t } = useI18n();

  useEffect(() => {
    const fetchAnalytics = async () => {
      const [ordersRes, customersRes, itemsRes] = await Promise.all([
        supabase.from("orders").select("total"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("order_items").select("quantity, unit_price, products(name)").order("quantity", { ascending: false }).limit(10),
      ]);

      const orders = ordersRes.data || [];
      const totalRev = orders.reduce((a: number, o: any) => a + Number(o.total), 0);
      const avgOrder = orders.length ? totalRev / orders.length : 0;

      const productMap: Record<string, { sales: number; revenue: number }> = {};
      (itemsRes.data || []).forEach((item: any) => {
        const name = item.products?.name || "Unknown";
        if (!productMap[name]) productMap[name] = { sales: 0, revenue: 0 };
        productMap[name].sales += item.quantity;
        productMap[name].revenue += item.quantity * Number(item.unit_price);
      });
      const top = Object.entries(productMap).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.sales - a.sales).slice(0, 5);

      setStats({ conversionRate: "3.24%", avgOrder: `$${avgOrder.toFixed(2)}`, totalOrders: orders.length, activeCustomers: customersRes.count || 0 });
      setTopProducts(top);
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

      <div className="dashboard-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">{t("admin.topSellingProducts")}</h2>
        <div className="space-y-4">
          {topProducts.map((p, i) => (
            <div key={p.name} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sales} {t("admin.sales")}</p>
                </div>
              </div>
              <span className="text-sm font-semibold text-foreground">${p.revenue.toFixed(2)}</span>
            </div>
          ))}
          {topProducts.length === 0 && <p className="text-sm text-muted-foreground">{t("admin.noSalesData")}</p>}
        </div>
      </div>
    </div>
  );
};

export default Analytics;

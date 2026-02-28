import { useState, useEffect } from "react";
import {
  DollarSign, ShoppingCart, Users, Package, AlertTriangle, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, products: 0 });
  const [latestOrders, setLatestOrders] = useState<any[]>([]);
  const [lowStock, setLowStock] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [ordersRes, customersRes, productsRes, latestRes, lowStockRes] = await Promise.all([
        supabase.from("orders").select("total, status"),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id, total, status, created_at, customer_id").order("created_at", { ascending: false }).limit(5),
        supabase.from("product_sizes").select("size_label, stock, products(name)").lt("stock", 10).order("stock").limit(5),
      ]);

      // Fetch customer names for latest orders
      const customerIds = [...new Set((latestRes.data || []).map((o: any) => o.customer_id).filter(Boolean))];
      let profilesMap: Record<string, string> = {};
      if (customerIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("user_id, name").in("user_id", customerIds);
        (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p.name; });
      }

      const orders = (latestRes.data || []).map((o: any) => ({ ...o, customerName: profilesMap[o.customer_id] || "—" }));

      const revenue = (ordersRes.data || []).reduce((a: number, o: any) => a + Number(o.total), 0);
      setStats({
        revenue,
        orders: ordersRes.data?.length || 0,
        customers: customersRes.count || 0,
        products: productsRes.count || 0,
      });
      setLatestOrders(orders);
      setLowStock((lowStockRes.data as any) || []);
      setLoading(false);
    };
    fetchData();
  }, []);

  const statusColors: Record<string, string> = {
    delivered: "bg-success/10 text-success",
    shipped: "bg-info/10 text-info",
    pending: "bg-warning/10 text-warning",
    paid: "bg-primary/10 text-primary",
    cancelled: "bg-destructive/10 text-destructive",
  };

  const statCards = [
    { label: "Total Revenue", value: `$${stats.revenue.toLocaleString("en", { minimumFractionDigits: 2 })}`, icon: DollarSign, color: "bg-primary/10 text-primary" },
    { label: "Total Orders", value: String(stats.orders), icon: ShoppingCart, color: "bg-secondary/10 text-secondary" },
    { label: "Total Customers", value: String(stats.customers), icon: Users, color: "bg-success/10 text-success" },
    { label: "Total Products", value: String(stats.products), icon: Package, color: "bg-warning/10 text-warning" },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 dashboard-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-foreground">Latest Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="table-header text-left p-4">Order ID</th>
                  <th className="table-header text-left p-4">Customer</th>
                  <th className="table-header text-left p-4">Total</th>
                  <th className="table-header text-left p-4">Status</th>
                  <th className="table-header text-left p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {latestOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-primary font-mono">{order.id.slice(0, 8)}...</td>
                    <td className="p-4 text-sm text-foreground">{order.customerName}</td>
                    <td className="p-4 text-sm font-medium text-foreground">${Number(order.total).toFixed(2)}</td>
                    <td className="p-4"><span className={`status-badge ${statusColors[order.status] || ""}`}>{order.status}</span></td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {latestOrders.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No orders yet</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Low Stock Alert</h2>
          </div>
          <div className="space-y-4">
            {lowStock.map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{item.products?.name || "—"}</p>
                  <p className="text-xs text-muted-foreground">Size: {item.size_label}</p>
                </div>
                <span className="status-badge bg-destructive/10 text-destructive">{item.stock} left</span>
              </div>
            ))}
            {lowStock.length === 0 && <p className="text-sm text-muted-foreground">All stock levels are healthy</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

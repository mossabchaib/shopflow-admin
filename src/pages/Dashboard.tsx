import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Button } from "@/components/ui/button";

const revenueData7 = [
  { day: "Mon", revenue: 4200 },
  { day: "Tue", revenue: 3800 },
  { day: "Wed", revenue: 5100 },
  { day: "Thu", revenue: 4600 },
  { day: "Fri", revenue: 6200 },
  { day: "Sat", revenue: 7100 },
  { day: "Sun", revenue: 5400 },
];

const revenueData30 = [
  { day: "1", revenue: 3200 }, { day: "5", revenue: 4100 }, { day: "10", revenue: 5800 },
  { day: "15", revenue: 4900 }, { day: "20", revenue: 6400 }, { day: "25", revenue: 7200 },
  { day: "30", revenue: 5600 },
];

const stats = [
  { label: "Total Revenue", value: "$48,250", change: "+12.5%", up: true, icon: DollarSign, color: "bg-primary/10 text-primary" },
  { label: "Total Orders", value: "1,284", change: "+8.2%", up: true, icon: ShoppingCart, color: "bg-secondary/10 text-secondary" },
  { label: "Total Customers", value: "3,642", change: "+5.1%", up: true, icon: Users, color: "bg-success/10 text-success" },
  { label: "Total Products", value: "456", change: "-2.4%", up: false, icon: Package, color: "bg-warning/10 text-warning" },
];

const latestOrders = [
  { id: "ORD-001", customer: "John Smith", total: "$129.99", status: "Delivered", date: "2026-02-25" },
  { id: "ORD-002", customer: "Sarah Connor", total: "$89.50", status: "Shipped", date: "2026-02-25" },
  { id: "ORD-003", customer: "Mike Wilson", total: "$245.00", status: "Pending", date: "2026-02-24" },
  { id: "ORD-004", customer: "Emma Davis", total: "$67.80", status: "Paid", date: "2026-02-24" },
  { id: "ORD-005", customer: "Alex Brown", total: "$312.40", status: "Cancelled", date: "2026-02-23" },
];

const lowStockProducts = [
  { name: "Wireless Headphones", stock: 3, threshold: 10 },
  { name: "USB-C Cable", stock: 5, threshold: 20 },
  { name: "Phone Case Pro", stock: 2, threshold: 15 },
];

const statusColors: Record<string, string> = {
  Delivered: "bg-success/10 text-success",
  Shipped: "bg-info/10 text-info",
  Pending: "bg-warning/10 text-warning",
  Paid: "bg-primary/10 text-primary",
  Cancelled: "bg-destructive/10 text-destructive",
};

const Dashboard = () => {
  const [range, setRange] = useState<"7" | "30">("7");
  const chartData = range === "7" ? revenueData7 : revenueData30;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="flex items-center justify-between">
              <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className={`flex items-center gap-1 text-xs font-medium ${stat.up ? "text-success" : "text-destructive"}`}>
                {stat.up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {stat.change}
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 dashboard-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-foreground">Revenue Overview</h2>
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <Button
                variant={range === "7" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setRange("7")}
              >
                7 Days
              </Button>
              <Button
                variant={range === "30" ? "default" : "ghost"}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setRange("30")}
              >
                30 Days
              </Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(224, 76%, 33%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(224, 76%, 33%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="day" className="text-xs" tick={{ fill: 'hsl(215, 16%, 47%)' }} />
              <YAxis className="text-xs" tick={{ fill: 'hsl(215, 16%, 47%)' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(0, 0%, 100%)',
                  border: '1px solid hsl(214, 32%, 91%)',
                  borderRadius: '8px',
                  fontSize: '13px',
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(224, 76%, 33%)"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Low Stock Alert */}
        <div className="dashboard-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <h2 className="text-lg font-semibold text-foreground">Low Stock Alert</h2>
          </div>
          <div className="space-y-4">
            {lowStockProducts.map((product) => (
              <div key={product.name} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{product.name}</p>
                  <p className="text-xs text-muted-foreground">Threshold: {product.threshold}</p>
                </div>
                <span className="status-badge bg-destructive/10 text-destructive">
                  {product.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Latest Orders */}
      <div className="dashboard-card">
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
                  <td className="p-4 text-sm font-medium text-primary">{order.id}</td>
                  <td className="p-4 text-sm text-foreground">{order.customer}</td>
                  <td className="p-4 text-sm font-medium text-foreground">{order.total}</td>
                  <td className="p-4">
                    <span className={`status-badge ${statusColors[order.status]}`}>{order.status}</span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{order.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

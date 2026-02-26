import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, ShoppingCart, DollarSign, Users } from "lucide-react";

const revenueData = [
  { month: "Sep", revenue: 18500 }, { month: "Oct", revenue: 22400 }, { month: "Nov", revenue: 28100 },
  { month: "Dec", revenue: 35600 }, { month: "Jan", revenue: 31200 }, { month: "Feb", revenue: 27800 },
];

const ordersData = [
  { month: "Sep", orders: 245 }, { month: "Oct", orders: 312 }, { month: "Nov", orders: 398 },
  { month: "Dec", orders: 487 }, { month: "Jan", orders: 421 }, { month: "Feb", orders: 356 },
];

const topProducts = [
  { name: "Wireless Headphones", sales: 142, revenue: "$11,338" },
  { name: "Running Shoes", sales: 98, revenue: "$11,759" },
  { name: "Cotton T-Shirt", sales: 215, revenue: "$5,373" },
  { name: "Leather Wallet", sales: 87, revenue: "$4,349" },
];

const topCustomers = [
  { name: "Mike Wilson", orders: 23, spent: "$3,450" },
  { name: "Alex Brown", orders: 17, spent: "$2,180" },
  { name: "John Smith", orders: 12, spent: "$1,245" },
];

const kpis = [
  { label: "Conversion Rate", value: "3.24%", icon: TrendingUp, color: "bg-success/10 text-success" },
  { label: "Avg Order Value", value: "$78.40", icon: DollarSign, color: "bg-primary/10 text-primary" },
  { label: "Total Orders", value: "2,219", icon: ShoppingCart, color: "bg-secondary/10 text-secondary" },
  { label: "Active Customers", value: "1,847", icon: Users, color: "bg-warning/10 text-warning" },
];

const Analytics = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Business performance overview</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="aRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(224, 76%, 33%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(224, 76%, 33%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(0,0%,100%)', border: '1px solid hsl(214,32%,91%)', borderRadius: '8px', fontSize: '13px' }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(224,76%,33%)" strokeWidth={2} fill="url(#aRevGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="dashboard-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Orders Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={ordersData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'hsl(215, 16%, 47%)', fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(0,0%,100%)', border: '1px solid hsl(214,32%,91%)', borderRadius: '8px', fontSize: '13px' }} />
              <Bar dataKey="orders" fill="hsl(189,94%,43%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="dashboard-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Top Selling Products</h2>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.sales} sales</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">{p.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Top Customers</h2>
          <div className="space-y-4">
            {topCustomers.map((c, i) => (
              <div key={c.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-muted-foreground w-6">{i + 1}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.orders} orders</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-foreground">{c.spent}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;

import { Search, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const orders = [
  { id: "ORD-001", customer: "John Smith", total: "$129.99", payment: "Credit Card", status: "Delivered", date: "2026-02-25" },
  { id: "ORD-002", customer: "Sarah Connor", total: "$89.50", payment: "PayPal", status: "Shipped", date: "2026-02-25" },
  { id: "ORD-003", customer: "Mike Wilson", total: "$245.00", payment: "Stripe", status: "Pending", date: "2026-02-24" },
  { id: "ORD-004", customer: "Emma Davis", total: "$67.80", payment: "Credit Card", status: "Paid", date: "2026-02-24" },
  { id: "ORD-005", customer: "Alex Brown", total: "$312.40", payment: "Cash on Delivery", status: "Cancelled", date: "2026-02-23" },
  { id: "ORD-006", customer: "Lisa Johnson", total: "$178.00", payment: "Stripe", status: "Shipped", date: "2026-02-23" },
  { id: "ORD-007", customer: "Tom Clark", total: "$95.20", payment: "PayPal", status: "Delivered", date: "2026-02-22" },
];

const statusColors: Record<string, string> = {
  Delivered: "bg-success/10 text-success",
  Shipped: "bg-info/10 text-info",
  Pending: "bg-warning/10 text-warning",
  Paid: "bg-primary/10 text-primary",
  Cancelled: "bg-destructive/10 text-destructive",
};

const statuses = ["All", "Pending", "Paid", "Shipped", "Delivered", "Cancelled"];

const Orders = () => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const filtered = orders.filter((o) => {
    const matchSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
    const matchStatus = status === "All" || o.status === status;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">{orders.length} orders total</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search orders..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="table-header text-left p-4">Order ID</th>
              <th className="table-header text-left p-4">Customer</th>
              <th className="table-header text-left p-4">Total</th>
              <th className="table-header text-left p-4">Payment</th>
              <th className="table-header text-left p-4">Status</th>
              <th className="table-header text-left p-4">Date</th>
              <th className="table-header text-left p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4 text-sm font-medium text-primary">{order.id}</td>
                <td className="p-4 text-sm text-foreground">{order.customer}</td>
                <td className="p-4 text-sm font-medium text-foreground">{order.total}</td>
                <td className="p-4 text-sm text-muted-foreground">{order.payment}</td>
                <td className="p-4"><span className={`status-badge ${statusColors[order.status]}`}>{order.status}</span></td>
                <td className="p-4 text-sm text-muted-foreground">{order.date}</td>
                <td className="p-4">
                  <Button variant="ghost" size="sm" className="text-muted-foreground"><Eye className="h-4 w-4 mr-1" />View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Orders;

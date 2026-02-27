import { useState, useEffect } from "react";
import { Search, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  status: string;
  payment_method: string;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total: number;
  notes: string | null;
  created_at: string;
  profiles?: { name: string; email: string } | null;
  order_items?: { id: string; quantity: number; unit_price: number; total_price: number; products?: { name: string } | null; product_sizes?: { size_label: string } | null }[];
}

const statuses = ["All", "pending", "paid", "shipped", "delivered", "cancelled"];
const statusColors: Record<string, string> = {
  delivered: "bg-success/10 text-success",
  shipped: "bg-info/10 text-info",
  pending: "bg-warning/10 text-warning",
  paid: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

const Orders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, profiles:customer_id(name, email), order_items(*, products(name), product_sizes(size_label))")
      .order("created_at", { ascending: false });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setOrders((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || (o.profiles as any)?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openView = (o: Order) => { setSelected(o); setViewOpen(true); };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase.from("orders").update({ status: newStatus as any }).eq("id", orderId);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setUpdating(false); return; }
    toast({ title: `Order status updated to ${newStatus}` });
    if (selected?.id === orderId) setSelected({ ...selected!, status: newStatus });
    setUpdating(false);
    fetchOrders();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

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
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s === "All" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
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
                <td className="p-4 text-sm font-medium text-primary font-mono">{order.id.slice(0, 8)}...</td>
                <td className="p-4 text-sm text-foreground">{(order.profiles as any)?.name || "—"}</td>
                <td className="p-4 text-sm font-medium text-foreground">${Number(order.total).toFixed(2)}</td>
                <td className="p-4 text-sm text-muted-foreground">{order.payment_method.replace("_", " ")}</td>
                <td className="p-4"><span className={`status-badge ${statusColors[order.status] || ""}`}>{order.status}</span></td>
                <td className="p-4 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => openView(order)}><Eye className="h-4 w-4 mr-1" />View</Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No orders found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Order Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Order ID</span><p className="font-mono text-sm">{selected.id}</p></div>
                <div><span className="text-sm text-muted-foreground">Customer</span><p>{(selected.profiles as any)?.name || "—"}</p></div>
                <div><span className="text-sm text-muted-foreground">Payment</span><p>{selected.payment_method.replace("_", " ")}</p></div>
                <div><span className="text-sm text-muted-foreground">Date</span><p>{new Date(selected.created_at).toLocaleString()}</p></div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">Status</span>
                <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)} disabled={updating}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending", "paid", "shipped", "delivered", "cancelled"].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selected.status === "cancelled" && <p className="text-xs text-destructive mt-1">Stock has been automatically restored.</p>}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-muted/50"><th className="text-left p-3 text-xs font-semibold">Item</th><th className="text-left p-3 text-xs font-semibold">Size</th><th className="text-left p-3 text-xs font-semibold">Qty</th><th className="text-left p-3 text-xs font-semibold">Price</th></tr></thead>
                  <tbody>
                    {selected.order_items?.map(item => (
                      <tr key={item.id} className="border-t">
                        <td className="p-3 text-sm">{item.products?.name || "—"}</td>
                        <td className="p-3 text-sm">{item.product_sizes?.size_label || "—"}</td>
                        <td className="p-3 text-sm">{item.quantity}</td>
                        <td className="p-3 text-sm">${Number(item.total_price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>${Number(selected.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Discount</span><span>-${Number(selected.discount_amount).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>${Number(selected.shipping_cost).toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold border-t pt-1"><span>Total</span><span>${Number(selected.total).toFixed(2)}</span></div>
              </div>

              {selected.notes && <div><span className="text-sm text-muted-foreground">Notes</span><p className="text-sm">{selected.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;

import { useState, useEffect } from "react";
import { Search, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const statuses = ["All", "pending", "paid", "shipped", "delivered", "cancelled"];
const statusColors: Record<string, string> = {
  delivered: "bg-success/10 text-success",
  shipped: "bg-info/10 text-info",
  pending: "bg-warning/10 text-warning",
  paid: "bg-primary/10 text-primary",
  cancelled: "bg-destructive/10 text-destructive",
};

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*, products(name), product_sizes(size_label))")
      .order("created_at", { ascending: false });
    if (error) { toast({ title: t("common.error"), description: error.message, variant: "destructive" }); setLoading(false); return; }

    const customerIds = [...new Set((data || []).map((o: any) => o.customer_id).filter(Boolean))];
    let profilesMap: Record<string, any> = {};
    if (customerIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, name, email").in("user_id", customerIds);
      (profiles || []).forEach((p: any) => { profilesMap[p.user_id] = p; });
    }

    setOrders((data || []).map((o: any) => ({
      ...o,
      profile: profilesMap[o.customer_id] || null,
      displayName: profilesMap[o.customer_id]?.name || o.guest_name || t("admin.guest"),
      displayEmail: profilesMap[o.customer_id]?.email || o.guest_email || "",
    })));
    setLoading(false);
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = orders.filter((o) => {
    const matchSearch = o.id.toLowerCase().includes(search.toLowerCase()) || o.displayName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "All" || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const openView = (o: any) => { setSelected(o); setViewOpen(true); };

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    const { error } = await supabase.from("orders").update({ status: newStatus as any }).eq("id", orderId);
    if (error) { toast({ title: t("common.error"), description: error.message, variant: "destructive" }); setUpdating(false); return; }
    toast({ title: t("admin.orderStatusUpdated") });
    if (selected?.id === orderId) setSelected({ ...selected!, status: newStatus });
    setUpdating(false);
    fetchOrders();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin.orders")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{orders.length} {t("admin.ordersTotal")}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("admin.searchOrders")} className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{statuses.map(s => <SelectItem key={s} value={s}>{s === "All" ? t("admin.all") : s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="table-header text-start p-4">{t("admin.orderId")}</th>
              <th className="table-header text-start p-4">{t("admin.customer")}</th>
              <th className="table-header text-start p-4">{t("admin.total")}</th>
              <th className="table-header text-start p-4">{t("admin.payment")}</th>
              <th className="table-header text-start p-4">{t("admin.status")}</th>
              <th className="table-header text-start p-4">{t("admin.date")}</th>
              <th className="table-header text-start p-4">{t("admin.action")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4 text-sm font-medium text-primary font-mono">{order.id.slice(0, 8)}...</td>
                <td className="p-4 text-sm text-foreground">
                  <div>{order.displayName}</div>
                  {!order.customer_id && <span className="text-xs text-muted-foreground">({t("admin.guest")})</span>}
                </td>
                <td className="p-4 text-sm font-medium text-foreground">${Number(order.total).toFixed(2)}</td>
                <td className="p-4 text-sm text-muted-foreground">{order.payment_method.replace("_", " ")}</td>
                <td className="p-4"><span className={`status-badge ${statusColors[order.status] || ""}`}>{order.status}</span></td>
                <td className="p-4 text-sm text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => openView(order)}><Eye className="h-4 w-4 me-1" />{t("admin.view")}</Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">{t("admin.noOrdersFound")}</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{t("admin.orderDetails")}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">{t("admin.orderId")}</span><p className="font-mono text-sm">{selected.id}</p></div>
                <div>
                  <span className="text-sm text-muted-foreground">{t("admin.customer")}</span>
                  <p>{selected.displayName}</p>
                  {selected.displayEmail && <p className="text-xs text-muted-foreground">{selected.displayEmail}</p>}
                  {selected.guest_phone && <p className="text-xs text-muted-foreground">{selected.guest_phone}</p>}
                  {!selected.customer_id && <span className="text-xs px-2 py-0.5 rounded bg-warning/10 text-warning">{t("admin.guest")}</span>}
                </div>
                <div><span className="text-sm text-muted-foreground">{t("admin.payment")}</span><p>{selected.payment_method.replace("_", " ")}</p></div>
                <div><span className="text-sm text-muted-foreground">{t("admin.date")}</span><p>{new Date(selected.created_at).toLocaleString()}</p></div>
              </div>

              <div>
                <span className="text-sm text-muted-foreground">{t("admin.status")}</span>
                <Select value={selected.status} onValueChange={(v) => updateStatus(selected.id, v)} disabled={updating}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["pending", "paid", "shipped", "delivered", "cancelled"].map(s => <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>)}
                  </SelectContent>
                </Select>
                {selected.status === "cancelled" && <p className="text-xs text-destructive mt-1">{t("admin.stockRestored")}</p>}
              </div>

              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead><tr className="bg-muted/50"><th className="text-start p-3 text-xs font-semibold">{t("admin.item")}</th><th className="text-start p-3 text-xs font-semibold">{t("admin.size")}</th><th className="text-start p-3 text-xs font-semibold">{t("admin.qty")}</th><th className="text-start p-3 text-xs font-semibold">{t("admin.price")}</th></tr></thead>
                  <tbody>
                    {selected.order_items?.map((item: any) => (
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
                <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.subtotal")}</span><span>${Number(selected.subtotal).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("checkout.discount")}</span><span>-${Number(selected.discount_amount || 0).toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("admin.shipping")}</span><span>${Number(selected.shipping_cost || 0).toFixed(2)}</span></div>
                <div className="flex justify-between font-semibold border-t pt-1"><span>{t("admin.total")}</span><span>${Number(selected.total).toFixed(2)}</span></div>
              </div>

              {selected.notes && <div><span className="text-sm text-muted-foreground">{t("admin.notes")}</span><p className="text-sm">{selected.notes}</p></div>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;

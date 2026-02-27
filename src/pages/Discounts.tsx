import { useState, useEffect } from "react";
import { Plus, Edit, Trash2, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order_value: number;
  usage_limit: number | null;
  usage_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

const Discounts = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Coupon | null>(null);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({ code: "", discount_type: "percentage" as string, discount_value: "", min_order_value: "", usage_limit: "", expires_at: "", is_active: true });

  const fetchCoupons = async () => {
    const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const openCreate = () => { setEditing(null); setForm({ code: "", discount_type: "percentage", discount_value: "", min_order_value: "", usage_limit: "", expires_at: "", is_active: true }); setDialogOpen(true); };
  const openEdit = (c: Coupon) => {
    setEditing(c);
    setForm({ code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value), min_order_value: String(c.min_order_value || ""), usage_limit: c.usage_limit ? String(c.usage_limit) : "", expires_at: c.expires_at ? c.expires_at.split("T")[0] : "", is_active: c.is_active });
    setDialogOpen(true);
  };
  const openView = (c: Coupon) => { setSelected(c); setViewOpen(true); };

  const handleSave = async () => {
    if (!form.code || !form.discount_value) { toast({ title: "Error", description: "Code and value are required", variant: "destructive" }); return; }
    setSaving(true);
    const data: any = {
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_value: form.min_order_value ? parseFloat(form.min_order_value) : 0,
      usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    };

    if (editing) {
      const { error } = await supabase.from("coupons").update(data).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Coupon updated" });
    } else {
      const { error } = await supabase.from("coupons").insert(data);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: "Coupon created" });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("coupons").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Coupon deleted" });
    fetchCoupons();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discounts & Coupons</h1>
          <p className="text-sm text-muted-foreground mt-1">{coupons.length} coupons</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Coupon</Button>
      </div>

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="table-header text-left p-4">Code</th>
              <th className="table-header text-left p-4">Type</th>
              <th className="table-header text-left p-4">Value</th>
              <th className="table-header text-left p-4">Expires</th>
              <th className="table-header text-left p-4">Usage</th>
              <th className="table-header text-left p-4">Status</th>
              <th className="table-header text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4 text-sm font-mono font-medium text-primary">{c.code}</td>
                <td className="p-4 text-sm text-muted-foreground">{c.discount_type}</td>
                <td className="p-4 text-sm font-medium text-foreground">{c.discount_type === "percentage" ? `${c.discount_value}%` : `$${Number(c.discount_value).toFixed(2)}`}</td>
                <td className="p-4 text-sm text-muted-foreground">{c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "Never"}</td>
                <td className="p-4 text-sm text-foreground">{c.usage_count}{c.usage_limit ? `/${c.usage_limit}` : ""}</td>
                <td className="p-4"><span className={`status-badge ${c.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{c.is_active ? "Active" : "Inactive"}</span></td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => openView(c)}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => openEdit(c)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Delete Coupon?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(c.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No coupons yet</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Create/Edit */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit Coupon" : "Add Coupon"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div><Label>Code</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="COUPON_CODE" className="mt-1.5 font-mono uppercase" /></div>
            <div>
              <Label>Discount Type</Label>
              <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Value</Label><Input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Usage Limit</Label><Input type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })} placeholder="Unlimited" className="mt-1.5" /></div>
            </div>
            <div><Label>Expiration</Label><Input type="date" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} className="mt-1.5" /></div>
            <div className="flex items-center justify-between"><Label>Active</Label><Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} /></div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? "Update" : "Create"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Coupon Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Code</span><p className="font-mono font-medium">{selected.code}</p></div>
                <div><span className="text-sm text-muted-foreground">Type</span><p>{selected.discount_type}</p></div>
                <div><span className="text-sm text-muted-foreground">Value</span><p>{selected.discount_type === "percentage" ? `${selected.discount_value}%` : `$${Number(selected.discount_value).toFixed(2)}`}</p></div>
                <div><span className="text-sm text-muted-foreground">Min Order</span><p>${Number(selected.min_order_value).toFixed(2)}</p></div>
                <div><span className="text-sm text-muted-foreground">Usage</span><p>{selected.usage_count}{selected.usage_limit ? `/${selected.usage_limit}` : " / Unlimited"}</p></div>
                <div><span className="text-sm text-muted-foreground">Expires</span><p>{selected.expires_at ? new Date(selected.expires_at).toLocaleDateString() : "Never"}</p></div>
                <div><span className="text-sm text-muted-foreground">Status</span><p><span className={`status-badge ${selected.is_active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{selected.is_active ? "Active" : "Inactive"}</span></p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Discounts;

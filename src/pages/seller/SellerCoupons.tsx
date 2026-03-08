import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Edit2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useUserStore } from "@/hooks/useStore";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const SellerCoupons = () => {
  const { store, isLoading: storeLoading } = useUserStore();
  const { toast } = useToast();
  const { t } = useI18n();
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code: "", discount_type: "percentage" as string, discount_value: "", min_order_value: "", usage_limit: "", expires_at: "", is_active: true });

  const fetchCoupons = async () => {
    if (!store) return;
    const { data } = await supabase.from("store_coupons").select("*").eq("store_id", store.id).order("created_at", { ascending: false });
    setCoupons(data || []);
    setLoading(false);
  };

  useEffect(() => { if (store) fetchCoupons(); }, [store]);

  const openCreate = () => { setEditing(null); setForm({ code: "", discount_type: "percentage", discount_value: "", min_order_value: "", usage_limit: "", expires_at: "", is_active: true }); setDialogOpen(true); };
  const openEdit = (c: any) => {
    setEditing(c);
    setForm({ code: c.code, discount_type: c.discount_type, discount_value: String(c.discount_value), min_order_value: c.min_order_value ? String(c.min_order_value) : "", usage_limit: c.usage_limit ? String(c.usage_limit) : "", expires_at: c.expires_at ? c.expires_at.slice(0, 16) : "", is_active: c.is_active });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!store || !form.code || !form.discount_value) { toast({ title: t("admin.codeValueRequired"), variant: "destructive" }); return; }
    const payload: any = {
      store_id: store.id,
      code: form.code.toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number(form.discount_value),
      min_order_value: form.min_order_value ? Number(form.min_order_value) : 0,
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    };
    if (editing) {
      await supabase.from("store_coupons").update(payload).eq("id", editing.id);
      toast({ title: t("admin.couponUpdated") });
    } else {
      await supabase.from("store_coupons").insert(payload);
      toast({ title: t("admin.couponCreated") });
    }
    setDialogOpen(false);
    fetchCoupons();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("store_coupons").delete().eq("id", id);
    toast({ title: t("admin.couponDeleted") });
    fetchCoupons();
  };

  if (storeLoading || loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!store) return <div className="text-center py-20 text-muted-foreground">{t("seller.noStore")}</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("seller.storeCoupons")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{coupons.length} {t("admin.coupons")}</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 me-2" />{t("admin.addCoupon")}</Button>
      </div>

      {coupons.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p>{t("admin.noCouponsYet")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.map((c) => (
            <div key={c.id} className="rounded-xl border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary text-lg">{c.code}</span>
                <Badge variant={c.is_active ? "default" : "secondary"}>{c.is_active ? t("admin.active") : t("admin.inactive")}</Badge>
              </div>
              <p className="text-2xl font-bold text-foreground">
                {c.discount_type === "percentage" ? `${c.discount_value}%` : `$${Number(c.discount_value).toFixed(2)}`}
                <span className="text-sm font-normal text-muted-foreground ms-1">{t("checkout.discount").toLowerCase()}</span>
              </p>
              {c.min_order_value > 0 && <p className="text-xs text-muted-foreground">{t("admin.minOrder")}: ${Number(c.min_order_value).toFixed(2)}</p>}
              <p className="text-xs text-muted-foreground">{t("admin.usage")}: {c.usage_count || 0}{c.usage_limit ? `/${c.usage_limit}` : ""}</p>
              {c.expires_at && <p className="text-xs text-muted-foreground">{t("admin.expires")}: {new Date(c.expires_at).toLocaleDateString()}</p>}
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(c)}><Edit2 className="h-3 w-3 me-1" />{t("admin.view")}</Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editing ? t("admin.editCoupon") : t("admin.addCoupon")}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label>{t("admin.code")}</Label><Input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="mt-1 font-mono" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>{t("admin.discountType")}</Label>
                <Select value={form.discount_type} onValueChange={v => setForm({ ...form, discount_type: v })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t("admin.percentage")}</SelectItem>
                    <SelectItem value="fixed">{t("admin.fixed")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>{t("admin.value")}</Label><Input type="number" value={form.discount_value} onChange={e => setForm({ ...form, discount_value: e.target.value })} className="mt-1" /></div>
            </div>
            <div><Label>{t("admin.minOrder")}</Label><Input type="number" value={form.min_order_value} onChange={e => setForm({ ...form, min_order_value: e.target.value })} className="mt-1" /></div>
            <div><Label>{t("admin.usageLimit")}</Label><Input type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: e.target.value })} className="mt-1" /></div>
            <div><Label>{t("admin.expiration")}</Label><Input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} className="mt-1" /></div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={v => setForm({ ...form, is_active: v })} />
              <Label>{t("admin.active")}</Label>
            </div>
            <Button className="w-full" onClick={handleSave}>{editing ? t("admin.updateProduct") : t("admin.createProduct")}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SellerCoupons;

import { useState, useEffect } from "react";
import { Eye, Check, X as XIcon, Loader2, Search, Store as StoreIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

const Stores = () => {
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewStore, setViewStore] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useI18n();

  const fetchStores = async () => {
    const { data } = await supabase
      .from("stores")
      .select("*, profiles!stores_owner_id_fkey(name, email)")
      .order("created_at", { ascending: false });
    setStores(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStores(); }, []);

  const updateStatus = async (id: string, status: string, ownerId: string) => {
    const { error } = await supabase.from("stores").update({ status }).eq("id", id);
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
      return;
    }

    // If approving, add seller role
    if (status === "approved") {
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", ownerId)
        .eq("role", "seller")
        .maybeSingle();

      if (!existingRole) {
        await supabase.from("user_roles").insert({ user_id: ownerId, role: "seller" as any });
      }
    }

    toast({ title: t("seller.storeStatusUpdated") });
    fetchStores();
  };

  const filtered = stores.filter(s =>
    s.store_name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  const statusColors: Record<string, string> = {
    approved: "bg-success/10 text-success",
    pending: "bg-warning/10 text-warning",
    rejected: "bg-destructive/10 text-destructive",
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin.stores")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{stores.length} {t("admin.storesTotal")}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("admin.searchStores")} className="ps-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="table-header text-start p-4">{t("seller.storeName")}</th>
              <th className="table-header text-start p-4">{t("admin.slug")}</th>
              <th className="table-header text-start p-4">{t("admin.customer")}</th>
              <th className="table-header text-start p-4">{t("admin.status")}</th>
              <th className="table-header text-start p-4">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {s.logo_url ? (
                      <img src={s.logo_url} className="h-10 w-10 rounded-lg object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <StoreIcon className="h-5 w-5 text-primary" />
                      </div>
                    )}
                    <span className="text-sm font-medium text-foreground">{s.store_name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground font-mono">/store/{s.slug}</td>
                <td className="p-4 text-sm text-muted-foreground">{s.profiles?.name || s.profiles?.email || "—"}</td>
                <td className="p-4"><span className={`status-badge ${statusColors[s.status] || ""}`}>{s.status}</span></td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewStore(s)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    {s.status === "pending" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => updateStatus(s.id, "approved", s.owner_id)}>
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateStatus(s.id, "rejected", s.owner_id)}>
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {s.status === "rejected" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => updateStatus(s.id, "approved", s.owner_id)}>
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    {s.status === "approved" && (
                      <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={`/store/${s.slug}`} target="_blank"><ExternalLink className="h-4 w-4" /></a>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("admin.noStoresFound")}</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={!!viewStore} onOpenChange={() => setViewStore(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin.storeDetails")}</DialogTitle></DialogHeader>
          {viewStore && (
            <div className="space-y-3 pt-2">
              {viewStore.logo_url && <img src={viewStore.logo_url} className="h-16 w-16 rounded-lg object-cover" />}
              <div><span className="text-sm text-muted-foreground">{t("seller.storeName")}:</span> <span className="text-sm font-medium">{viewStore.store_name}</span></div>
              <div><span className="text-sm text-muted-foreground">{t("admin.slug")}:</span> <span className="text-sm font-mono">/store/{viewStore.slug}</span></div>
              <div><span className="text-sm text-muted-foreground">{t("admin.description")}:</span> <span className="text-sm">{viewStore.description || "—"}</span></div>
              <div><span className="text-sm text-muted-foreground">{t("admin.status")}:</span> <span className={`status-badge ${statusColors[viewStore.status]}`}>{viewStore.status}</span></div>
              <div><span className="text-sm text-muted-foreground">{t("admin.customer")}:</span> <span className="text-sm">{viewStore.profiles?.name || "—"} ({viewStore.profiles?.email || "—"})</span></div>
              {viewStore.background_url && (
                <div>
                  <span className="text-sm text-muted-foreground">{t("seller.background")}:</span>
                  <img src={viewStore.background_url} className="mt-2 w-full h-32 rounded-lg object-cover" />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Stores;

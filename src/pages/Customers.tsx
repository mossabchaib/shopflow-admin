import { useState, useEffect } from "react";
import { Search, Eye, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

interface Customer {
  id: string; user_id: string; name: string; email: string; phone: string | null; avatar: string | null; created_at: string;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const { toast } = useToast();
  const { t } = useI18n();

  const fetchCustomers = async () => {
    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (error) { toast({ title: t("common.error"), description: error.message, variant: "destructive" }); return; }
    setCustomers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCustomers(); }, []);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin.customers")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{customers.length} {t("admin.customersTotal")}</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder={t("admin.searchCustomers")} className="ps-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="table-header text-start p-4">{t("admin.customer")}</th>
              <th className="table-header text-start p-4">{t("admin.email")}</th>
              <th className="table-header text-start p-4">{t("admin.phone")}</th>
              <th className="table-header text-start p-4">{t("admin.registered")}</th>
              <th className="table-header text-start p-4">{t("admin.action")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {c.name ? c.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
                    </div>
                    <span className="text-sm font-medium text-foreground">{c.name || "—"}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground">{c.email}</td>
                <td className="p-4 text-sm text-muted-foreground">{c.phone || "—"}</td>
                <td className="p-4 text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</td>
                <td className="p-4">
                  <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => { setSelected(c); setViewOpen(true); }}><Eye className="h-4 w-4 me-1" />{t("admin.view")}</Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">{t("admin.noCustomersFound")}</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin.customerDetails")}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 pt-4">
              <div className="flex items-center gap-3">
                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-lg font-semibold text-primary">
                  {selected.name ? selected.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) : "?"}
                </div>
                <div>
                  <p className="font-medium text-foreground">{selected.name || "—"}</p>
                  <p className="text-sm text-muted-foreground">{selected.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">{t("admin.phone")}</span><p>{selected.phone || "—"}</p></div>
                <div><span className="text-sm text-muted-foreground">{t("admin.registered")}</span><p>{new Date(selected.created_at).toLocaleDateString()}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;

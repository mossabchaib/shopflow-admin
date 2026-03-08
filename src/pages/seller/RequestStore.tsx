import { useState } from "react";
import { Loader2, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/hooks/useAuth";
import { useUserStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";

const RequestStore = () => {
  const { user } = useAuth();
  const { store, isLoading, refetch } = useUserStore();
  const { toast } = useToast();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ store_name: "", slug: "", description: "" });

  const handleSubmit = async () => {
    if (!form.store_name || !form.slug) {
      toast({ title: t("common.error"), description: t("seller.nameSlugRequired"), variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("stores").insert({
      owner_id: user!.id,
      store_name: form.store_name,
      slug: form.slug,
      description: form.description || null,
    } as any);

    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("seller.storeRequested") });
      refetch();
    }
    setSaving(false);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (store) {
    return (
      <div className="max-w-lg mx-auto py-20 text-center space-y-4">
        <Store className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-foreground">{store.store_name}</h2>
        {store.status === "pending" && (
          <div className="px-4 py-3 rounded-lg bg-warning/10 text-warning font-medium">
            {t("seller.pendingApproval")}
          </div>
        )}
        {store.status === "approved" && (
          <div className="px-4 py-3 rounded-lg bg-success/10 text-success font-medium">
            {t("seller.storeApproved")}
          </div>
        )}
        {store.status === "rejected" && (
          <div className="px-4 py-3 rounded-lg bg-destructive/10 text-destructive font-medium">
            {t("seller.storeRejected")}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto py-12 space-y-6">
      <div className="text-center">
        <Store className="h-12 w-12 text-primary mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground">{t("seller.requestStore")}</h1>
        <p className="text-muted-foreground mt-2">{t("seller.requestStoreDesc")}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label>{t("seller.storeName")}</Label>
          <Input value={form.store_name} onChange={e => setForm({ ...form, store_name: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label>{t("seller.storeSlug")}</Label>
          <div className="flex items-center gap-2 mt-1.5">
            <span className="text-sm text-muted-foreground">/store/</span>
            <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "") })} />
          </div>
        </div>
        <div>
          <Label>{t("admin.description")}</Label>
          <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1.5" rows={3} />
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={saving} className="w-full">
        {saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
        {t("seller.submitRequest")}
      </Button>
    </div>
  );
};

export default RequestStore;

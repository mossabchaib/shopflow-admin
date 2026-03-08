import { useState, useEffect } from "react";
import { Loader2, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { useUserStore } from "@/hooks/useStore";
import { supabase } from "@/integrations/supabase/client";

const StoreSettings = () => {
  const { store, isLoading, refetch } = useUserStore();
  const { toast } = useToast();
  const { t } = useI18n();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    store_name: "",
    slug: "",
    description: "",
    logo_url: "",
    background_url: "",
  });

  useEffect(() => {
    if (store) {
      setForm({
        store_name: store.store_name || "",
        slug: store.slug || "",
        description: store.description || "",
        logo_url: store.logo_url || "",
        background_url: store.background_url || "",
      });
    }
  }, [store]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: "logo_url" | "background_url") => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `stores/${store?.id || "new"}/${field}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm(prev => ({ ...prev, [field]: urlData.publicUrl }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.store_name || !form.slug) {
      toast({ title: t("common.error"), description: t("seller.nameSlugRequired"), variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("stores")
      .update({
        store_name: form.store_name,
        slug: form.slug,
        description: form.description || null,
        logo_url: form.logo_url || null,
        background_url: form.background_url || null,
      })
      .eq("id", store!.id);

    if (error) {
      toast({ title: t("common.error"), description: error.message, variant: "destructive" });
    } else {
      toast({ title: t("seller.storeUpdated") });
      refetch();
    }
    setSaving(false);
  };

  if (isLoading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!store) return (
    <div className="text-center py-20">
      <p className="text-muted-foreground">{t("seller.noStore")}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("seller.storeSettings")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("seller.customizeStore")}</p>
        {store.status === "pending" && (
          <div className="mt-3 px-4 py-2 rounded-lg bg-warning/10 text-warning text-sm font-medium">
            {t("seller.pendingApproval")}
          </div>
        )}
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

        {/* Logo */}
        <div>
          <Label>{t("seller.logo")}</Label>
          <div className="mt-1.5 flex items-center gap-4">
            {form.logo_url && <img src={form.logo_url} alt="Logo" className="h-16 w-16 rounded-lg object-cover border" />}
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild><span><Upload className="h-4 w-4 me-2" />{t("admin.uploadImage")}</span></Button>
              <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, "logo_url")} />
            </label>
          </div>
        </div>

        {/* Background */}
        <div>
          <Label>{t("seller.background")}</Label>
          <div className="mt-1.5 space-y-2">
            {form.background_url && <img src={form.background_url} alt="Background" className="w-full h-40 rounded-lg object-cover border" />}
            <label className="cursor-pointer">
              <Button variant="outline" size="sm" asChild><span><Upload className="h-4 w-4 me-2" />{t("admin.uploadImage")}</span></Button>
              <input type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e, "background_url")} />
            </label>
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || uploading}>
        {saving ? <Loader2 className="h-4 w-4 me-2 animate-spin" /> : <Save className="h-4 w-4 me-2" />}
        {t("seller.saveSettings")}
      </Button>
    </div>
  );
};

export default StoreSettings;

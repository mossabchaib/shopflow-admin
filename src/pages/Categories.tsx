import { useState, useEffect, useRef } from "react";
import { Plus, Edit, Trash2, Eye, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Category { id: string; name: string; slug: string; image_url: string | null; created_at: string; }

const Categories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Category | null>(null);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", image_url: "" });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `categories/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) { toast({ title: t("common.error"), description: error.message, variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    setForm(f => ({ ...f, image_url: urlData.publicUrl }));
    setPreviewUrl(urlData.publicUrl);
    setUploading(false);
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase.from("categories").select("*").order("created_at", { ascending: false });
    if (error) { toast({ title: t("common.error"), description: error.message, variant: "destructive" }); return; }
    setCategories(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => { setEditing(null); setForm({ name: "", slug: "", image_url: "" }); setPreviewUrl(null); setDialogOpen(true); };
  const openEdit = (cat: Category) => { setEditing(cat); setForm({ name: cat.name, slug: cat.slug, image_url: cat.image_url || "" }); setPreviewUrl(cat.image_url || null); setDialogOpen(true); };

  const handleSave = async () => {
    if (!form.name || !form.slug) { toast({ title: t("common.error"), description: t("admin.nameSlugRequired"), variant: "destructive" }); return; }
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("categories").update({ name: form.name, slug: form.slug, image_url: form.image_url || null }).eq("id", editing.id);
      if (error) { toast({ title: t("common.error"), description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: t("admin.categoryUpdated") });
    } else {
      const { error } = await supabase.from("categories").insert({ name: form.name, slug: form.slug, image_url: form.image_url || null });
      if (error) { toast({ title: t("common.error"), description: error.message, variant: "destructive" }); setSaving(false); return; }
      toast({ title: t("admin.categoryCreated") });
    }
    setSaving(false);
    setDialogOpen(false);
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) { toast({ title: t("common.error"), description: error.message, variant: "destructive" }); return; }
    toast({ title: t("admin.categoryDeleted") });
    fetchCategories();
  };

  const autoSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("admin.categories")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{categories.length} {t("admin.categories").toLowerCase()}</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 me-2" />{t("admin.addCategory")}</Button>
      </div>

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="table-header text-start p-4">{t("admin.name")}</th>
              <th className="table-header text-start p-4">{t("admin.slug")}</th>
              <th className="table-header text-start p-4">{t("admin.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4 text-sm font-medium text-foreground">{cat.name}</td>
                <td className="p-4 text-sm text-muted-foreground font-mono">{cat.slug}</td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => { setSelected(cat); setViewOpen(true); }}><Eye className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => openEdit(cat)}><Edit className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>{t("admin.deleteCategory")}</AlertDialogTitle><AlertDialogDescription>{t("admin.deleteCategoryDesc")}</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>{t("admin.cancel")}</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(cat.id)}>{t("admin.delete")}</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </td>
              </tr>
            ))}
            {categories.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-muted-foreground">{t("admin.noCategoriesYet")}</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? t("admin.editCategory") : t("admin.addCategory")}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div><Label>{t("admin.name")}</Label><Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value, slug: editing ? form.slug : autoSlug(e.target.value) }); }} className="mt-1.5" /></div>
            <div><Label>{t("admin.slug")}</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="mt-1.5" /></div>
            <div>
              <Label>{t("admin.images")}</Label>
              <div className="mt-1.5 space-y-2">
                {previewUrl && (
                  <div className="relative inline-block">
                    <img src={previewUrl} alt="preview" className="h-24 w-24 rounded-lg object-cover border border-border" />
                    <button onClick={() => { setPreviewUrl(null); setForm(f => ({ ...f, image_url: "" })); }} className="absolute -top-2 -end-2 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                    {uploading ? <Loader2 className="h-4 w-4 me-1 animate-spin" /> : <Upload className="h-4 w-4 me-1" />}
                    {uploading ? "..." : t("admin.uploadImage")}
                  </Button>
                  <Input value={form.image_url} onChange={(e) => { setForm({ ...form, image_url: e.target.value }); setPreviewUrl(e.target.value || null); }} placeholder="https://..." className="flex-1 text-xs" />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); e.target.value = ""; }} />
              </div>
            </div>
            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 me-2 animate-spin" />}{editing ? t("admin.categoryUpdated").replace("تم تحديث التصنيف","تحديث").replace("Category updated","Update").replace("Catégorie mise à jour","Modifier") : t("admin.addCategory")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t("admin.categoryDetails")}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 pt-4">
              <div><span className="text-sm text-muted-foreground">{t("admin.name")}:</span><p className="font-medium">{selected.name}</p></div>
              <div><span className="text-sm text-muted-foreground">{t("admin.slug")}:</span><p className="font-mono">{selected.slug}</p></div>
              {selected.image_url && <div><span className="text-sm text-muted-foreground">{t("admin.images")}:</span><img src={selected.image_url} alt={selected.name} className="mt-1 h-32 rounded-lg object-cover" /></div>}
              <div><span className="text-sm text-muted-foreground">{t("admin.created")}:</span><p>{new Date(selected.created_at).toLocaleDateString()}</p></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Categories;

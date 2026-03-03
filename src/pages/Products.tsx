import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, Eye, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface ProductSize { id?: string; size_label: string; extra_price: number; }
interface ProductColor { id?: string; color_name: string; color_hex: string; }
interface Variant { size_index: number; color_index: number; stock: number; }
interface Supplier { id: string; name: string; }

interface Product {
  id: string; name: string; description: string | null; price: number; cost_price: number; discount_price: number | null;
  category_id: string | null; supplier_id: string | null; stock: number; status: string; created_at: string;
  categories?: { name: string } | null; suppliers?: { name: string } | null;
  product_images?: { id: string; image_url: string; is_primary: boolean }[];
  product_sizes?: { id: string; size_label: string; stock: number; extra_price: number }[];
  product_colors?: { id: string; color_name: string; color_hex: string; stock: number }[];
  product_variants?: { id: string; size_id: string; color_id: string; stock: number }[];
}

interface Category { id: string; name: string; }

const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "", description: "", price: "", cost_price: "", discount_price: "", category_id: "", supplier_id: "", status: "active" as string,
  });
  const [sizes, setSizes] = useState<ProductSize[]>([{ size_label: "M", extra_price: 0 }]);
  const [colors, setColors] = useState<ProductColor[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const fetchData = async () => {
    const [prodRes, catRes, supRes] = await Promise.all([
      supabase.from("products").select("*, categories(name), product_images(*), product_sizes(*), product_colors(*), product_variants(*)").order("created_at", { ascending: false }),
      supabase.from("categories").select("id, name").order("name"),
      supabase.from("suppliers").select("id, name").order("name"),
    ]);
    if (prodRes.data) setProducts(prodRes.data as any);
    if (catRes.data) setCategories(catRes.data);
    if (supRes.data) setSuppliers(supRes.data as any);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = categoryFilter === "All" || p.categories?.name === categoryFilter;
    return matchSearch && matchCat;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "", price: "", cost_price: "", discount_price: "", category_id: "", supplier_id: "", status: "active" });
    setSizes([{ size_label: "M", extra_price: 0 }]);
    setColors([]);
    setVariants([]);
    setImageUrls([]);
    setDialogOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      name: p.name, description: p.description || "", price: String(p.price),
      cost_price: String(p.cost_price || 0), discount_price: p.discount_price ? String(p.discount_price) : "",
      category_id: p.category_id || "", supplier_id: p.supplier_id || "", status: p.status
    });
    const sSizes = p.product_sizes?.map(s => ({ id: s.id, size_label: s.size_label, extra_price: Number(s.extra_price) })) || [];
    const sColors = p.product_colors?.map(c => ({ id: c.id, color_name: c.color_name, color_hex: c.color_hex })) || [];
    setSizes(sSizes);
    setColors(sColors);

    // Map variants back to indices
    const vList: Variant[] = [];
    (p.product_variants || []).forEach(v => {
      const sIdx = sSizes.findIndex(s => s.id === v.size_id);
      const cIdx = sColors.findIndex(c => c.id === v.color_id);
      if (sIdx >= 0 && cIdx >= 0) vList.push({ size_index: sIdx, color_index: cIdx, stock: v.stock });
    });
    setVariants(vList);
    setImageUrls(p.product_images?.map(i => i.image_url) || []);
    setDialogOpen(true);
  };

  const openView = (p: Product) => { setSelected(p); setViewOpen(true); };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (error) { toast({ title: "Upload error", description: error.message, variant: "destructive" }); continue; }
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
      setImageUrls(prev => [...prev, urlData.publicUrl]);
    }
    setUploading(false);
  };

  const removeImage = (idx: number) => setImageUrls(prev => prev.filter((_, i) => i !== idx));
  const addSize = () => setSizes(prev => [...prev, { size_label: "", extra_price: 0 }]);
  const removeSize = (idx: number) => {
    setSizes(prev => prev.filter((_, i) => i !== idx));
    setVariants(prev => prev.filter(v => v.size_index !== idx).map(v => ({ ...v, size_index: v.size_index > idx ? v.size_index - 1 : v.size_index })));
  };
  const updateSize = (idx: number, field: string, value: any) => setSizes(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));

  const addColor = () => setColors(prev => [...prev, { color_name: "", color_hex: "#000000" }]);
  const removeColor = (idx: number) => {
    setColors(prev => prev.filter((_, i) => i !== idx));
    setVariants(prev => prev.filter(v => v.color_index !== idx).map(v => ({ ...v, color_index: v.color_index > idx ? v.color_index - 1 : v.color_index })));
  };
  const updateColor = (idx: number, field: string, value: any) => setColors(prev => prev.map((c, i) => i === idx ? { ...c, [field]: value } : c));

  const getVariantStock = (sIdx: number, cIdx: number) => {
    return variants.find(v => v.size_index === sIdx && v.color_index === cIdx)?.stock ?? 0;
  };
  const setVariantStock = (sIdx: number, cIdx: number, stock: number) => {
    setVariants(prev => {
      const existing = prev.findIndex(v => v.size_index === sIdx && v.color_index === cIdx);
      if (existing >= 0) return prev.map((v, i) => i === existing ? { ...v, stock } : v);
      return [...prev, { size_index: sIdx, color_index: cIdx, stock }];
    });
  };

  const totalStock = variants.reduce((a, v) => a + v.stock, 0);

  const handleSave = async () => {
    if (!form.name || !form.price) { toast({ title: "Error", description: "Name and price are required", variant: "destructive" }); return; }
    setSaving(true);
    const productData = {
      name: form.name,
      description: form.description || null,
      price: parseFloat(form.price),
      cost_price: parseFloat(form.cost_price) || 0,
      discount_price: form.discount_price ? parseFloat(form.discount_price) : null,
      category_id: form.category_id || null,
      supplier_id: form.supplier_id || null,
      stock: totalStock,
      status: form.status as any,
    };

    let productId = editing?.id;

    if (editing) {
      const { error } = await supabase.from("products").update(productData).eq("id", editing.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
    } else {
      const { data, error } = await supabase.from("products").insert(productData).select("id").single();
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); setSaving(false); return; }
      productId = data.id;
    }

    if (productId) {
      // Images
      await supabase.from("product_images").delete().eq("product_id", productId);
      if (imageUrls.length > 0) {
        await supabase.from("product_images").insert(imageUrls.map((url, i) => ({ product_id: productId!, image_url: url, is_primary: i === 0, sort_order: i })));
      }

      // Sizes
      await supabase.from("product_variants").delete().eq("product_id", productId);
      await supabase.from("product_sizes").delete().eq("product_id", productId);
      const validSizes = sizes.filter(s => s.size_label);
      let sizeIds: string[] = [];
      if (validSizes.length > 0) {
        const { data: sizeData } = await supabase.from("product_sizes").insert(
          validSizes.map(s => ({ product_id: productId!, size_label: s.size_label, stock: 0, extra_price: Number(s.extra_price) }))
        ).select("id");
        sizeIds = (sizeData || []).map(s => s.id);
      }

      // Colors
      await supabase.from("product_colors").delete().eq("product_id", productId);
      const validColors = colors.filter(c => c.color_name);
      let colorIds: string[] = [];
      if (validColors.length > 0) {
        const { data: colorData } = await supabase.from("product_colors").insert(
          validColors.map(c => ({ product_id: productId!, color_name: c.color_name, color_hex: c.color_hex, stock: 0 }))
        ).select("id");
        colorIds = (colorData || []).map(c => c.id);
      }

      // Variants (size+color+stock)
      if (sizeIds.length > 0 && colorIds.length > 0) {
        const variantInserts = variants
          .filter(v => v.stock > 0 && v.size_index < validSizes.length && v.color_index < validColors.length)
          .map(v => ({
            product_id: productId!,
            size_id: sizeIds[v.size_index],
            color_id: colorIds[v.color_index],
            stock: v.stock,
          }));
        if (variantInserts.length > 0) {
          await supabase.from("product_variants").insert(variantInserts);
        }
      }
    }

    toast({ title: editing ? "Product updated" : "Product created" });
    setSaving(false);
    setDialogOpen(false);
    fetchData();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Product deleted" });
    fetchData();
  };

  const profit = form.price && form.cost_price ? (parseFloat(form.price) - parseFloat(form.cost_price)) : 0;
  const profitPct = form.cost_price && parseFloat(form.cost_price) > 0 ? ((profit / parseFloat(form.cost_price)) * 100).toFixed(1) : "0";

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} products total</p>
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Product</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="table-header text-left p-4">Product</th>
              <th className="table-header text-left p-4">Category</th>
              <th className="table-header text-left p-4">Cost</th>
              <th className="table-header text-left p-4">Price</th>
              <th className="table-header text-left p-4">Stock</th>
              <th className="table-header text-left p-4">Status</th>
              <th className="table-header text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const img = p.product_images?.find(i => i.is_primary)?.image_url || p.product_images?.[0]?.image_url;
              return (
                <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {img ? <img src={img} className="h-10 w-10 rounded-lg object-cover" /> : <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-xs">No img</div>}
                      <span className="text-sm font-medium text-foreground">{p.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{p.categories?.name || "—"}</td>
                  <td className="p-4 text-sm text-muted-foreground">${Number(p.cost_price || 0).toFixed(2)}</td>
                  <td className="p-4 text-sm font-medium text-foreground">${Number(p.price).toFixed(2)}</td>
                  <td className="p-4"><span className={`text-sm font-medium ${p.stock < 10 ? "text-destructive" : "text-foreground"}`}>{p.stock}</span></td>
                  <td className="p-4"><span className={`status-badge ${p.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{p.status === "active" ? "Active" : "Draft"}</span></td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => openView(p)}><Eye className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Delete Product?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this product.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(p.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No products found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-4">
            <div><Label>Name</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Product name" className="mt-1.5" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="mt-1.5" /></div>

            {/* Pricing */}
            <div className="grid grid-cols-3 gap-4">
              <div><Label>Cost Price (Purchase)</Label><Input type="number" step="0.01" value={form.cost_price} onChange={e => setForm({ ...form, cost_price: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Sell Price</Label><Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Discount Price</Label><Input type="number" step="0.01" value={form.discount_price} onChange={e => setForm({ ...form, discount_price: e.target.value })} className="mt-1.5" /></div>
            </div>
            {parseFloat(form.cost_price) > 0 && parseFloat(form.price) > 0 && (
              <div className="flex gap-4 text-sm">
                <span className="text-muted-foreground">Profit: <span className={`font-semibold ${profit >= 0 ? "text-success" : "text-destructive"}`}>${profit.toFixed(2)} ({profitPct}%)</span></span>
                <span className="text-muted-foreground">Total Stock: <span className="font-semibold text-foreground">{totalStock}</span></span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm({ ...form, category_id: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Supplier</Label>
                <Select value={form.supplier_id} onValueChange={v => setForm({ ...form, supplier_id: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between pt-6">
                <Label>Active</Label>
                <Switch checked={form.status === "active"} onCheckedChange={v => setForm({ ...form, status: v ? "active" : "draft" })} />
              </div>
            </div>

            {/* Images */}
            <div>
              <Label>Images</Label>
              <div className="flex flex-wrap gap-2 mt-1.5">
                {imageUrls.map((url, i) => (
                  <div key={i} className="relative">
                    <img src={url} className="h-20 w-20 rounded-lg object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground rounded-full h-5 w-5 flex items-center justify-center"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <label className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary transition-colors">
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <Upload className="h-5 w-5 text-muted-foreground" />}
                  <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              </div>
            </div>

            {/* Sizes */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Sizes</Label>
                <Button variant="outline" size="sm" onClick={addSize}><Plus className="h-3 w-3 mr-1" />Add Size</Button>
              </div>
              <div className="space-y-2 mt-2">
                {sizes.map((s, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input placeholder="Size (S, M, L...)" value={s.size_label} onChange={e => updateSize(i, "size_label", e.target.value)} className="flex-1" />
                    <Input type="number" step="0.01" placeholder="Extra $" value={s.extra_price} onChange={e => updateSize(i, "extra_price", parseFloat(e.target.value) || 0)} className="w-24" />
                    {sizes.length > 1 && <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeSize(i)}><X className="h-4 w-4" /></Button>}
                  </div>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div>
              <div className="flex items-center justify-between">
                <Label>Colors</Label>
                <Button variant="outline" size="sm" onClick={addColor}><Plus className="h-3 w-3 mr-1" />Add Color</Button>
              </div>
              <div className="space-y-2 mt-2">
                {colors.map((c, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <Input placeholder="Color name" value={c.color_name} onChange={e => updateColor(i, "color_name", e.target.value)} className="flex-1" />
                    <input type="color" value={c.color_hex} onChange={e => updateColor(i, "color_hex", e.target.value)} className="h-9 w-12 rounded border border-border cursor-pointer" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeColor(i)}><X className="h-4 w-4" /></Button>
                  </div>
                ))}
                {colors.length === 0 && <p className="text-xs text-muted-foreground">No colors added yet.</p>}
              </div>
            </div>

            {/* Stock Matrix (Size x Color) */}
            {sizes.filter(s => s.size_label).length > 0 && colors.filter(c => c.color_name).length > 0 && (
              <div>
                <Label>Stock per Size × Color</Label>
                <div className="overflow-x-auto mt-2">
                  <table className="w-full border text-sm">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2 border text-left font-medium">Size \ Color</th>
                        {colors.filter(c => c.color_name).map((c, ci) => (
                          <th key={ci} className="p-2 border text-center font-medium">
                            <div className="flex items-center justify-center gap-1">
                              <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.color_hex }} />
                              {c.color_name}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sizes.filter(s => s.size_label).map((s, si) => (
                        <tr key={si}>
                          <td className="p-2 border font-medium">{s.size_label}</td>
                          {colors.filter(c => c.color_name).map((_, ci) => (
                            <td key={ci} className="p-1 border">
                              <Input
                                type="number"
                                min="0"
                                value={getVariantStock(si, ci)}
                                onChange={e => setVariantStock(si, ci, parseInt(e.target.value) || 0)}
                                className="w-20 mx-auto text-center h-8"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <Button className="w-full" onClick={handleSave} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editing ? "Update Product" : "Create Product"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Product Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 pt-4">
              {selected.product_images && selected.product_images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">{selected.product_images.map(img => <img key={img.id} src={img.image_url} className="h-32 rounded-lg object-cover" />)}</div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Name</span><p className="font-medium">{selected.name}</p></div>
                <div><span className="text-sm text-muted-foreground">Category</span><p>{selected.categories?.name || "—"}</p></div>
                <div><span className="text-sm text-muted-foreground">Cost Price</span><p>${Number(selected.cost_price || 0).toFixed(2)}</p></div>
                <div><span className="text-sm text-muted-foreground">Sell Price</span><p className="font-medium">${Number(selected.price).toFixed(2)}</p></div>
                <div><span className="text-sm text-muted-foreground">Discount</span><p>{selected.discount_price ? `$${Number(selected.discount_price).toFixed(2)}` : "—"}</p></div>
                <div><span className="text-sm text-muted-foreground">Profit</span><p className="font-medium text-success">${(Number(selected.price) - Number(selected.cost_price || 0)).toFixed(2)}</p></div>
                <div><span className="text-sm text-muted-foreground">Total Stock</span><p>{selected.stock}</p></div>
                <div><span className="text-sm text-muted-foreground">Status</span><p><span className={`status-badge ${selected.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{selected.status}</span></p></div>
              </div>
              {selected.description && <div><span className="text-sm text-muted-foreground">Description</span><p className="text-sm">{selected.description}</p></div>}

              {/* Variant stock matrix in view */}
              {selected.product_sizes && selected.product_sizes.length > 0 && selected.product_colors && selected.product_colors.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Stock (Size × Color)</span>
                  <div className="overflow-x-auto mt-1">
                    <table className="w-full border text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="p-2 border text-left">Size</th>
                          {selected.product_colors.map(c => (
                            <th key={c.id} className="p-2 border text-center">
                              <div className="flex items-center justify-center gap-1">
                                <span className="w-3 h-3 rounded-full border" style={{ backgroundColor: c.color_hex }} />
                                {c.color_name}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.product_sizes.map(s => (
                          <tr key={s.id}>
                            <td className="p-2 border font-medium">{s.size_label}</td>
                            {selected.product_colors!.map(c => {
                              const v = selected.product_variants?.find(v => v.size_id === s.id && v.color_id === c.id);
                              return <td key={c.id} className="p-2 border text-center">{v?.stock ?? 0}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Products;

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Heart, Plus, Trash2, Loader2, Edit2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export default function Wishlists() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [wishlists, setWishlists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const { data: wls } = await supabase.from("wishlists").select("*").eq("user_id", user.id).order("created_at");
    if (!wls || wls.length === 0) { setWishlists([]); setLoading(false); return; }

    const wlIds = wls.map(w => w.id);
    const { data: items } = await supabase
      .from("wishlist_items")
      .select("*, products(*, product_images(image_url, is_primary), categories(name))")
      .in("wishlist_id", wlIds);

    setWishlists(wls.map(w => ({
      ...w,
      items: (items || []).filter(i => i.wishlist_id === w.id).map(i => i.products).filter(Boolean),
    })));
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const createWishlist = async () => {
    if (!user || !newName.trim()) return;
    await supabase.from("wishlists").insert({ user_id: user.id, name: newName.trim() });
    setNewName("");
    fetchAll();
    toast.success(t("wishlists.created"));
  };

  const deleteWishlist = async (id: string) => {
    await supabase.from("wishlists").delete().eq("id", id);
    fetchAll();
    toast.success(t("wishlists.deleted"));
  };

  const renameWishlist = async (id: string) => {
    if (!editName.trim()) return;
    await supabase.from("wishlists").update({ name: editName.trim() }).eq("id", id);
    setEditingId(null);
    fetchAll();
  };

  const removeItem = async (wishlistId: string, productId: string) => {
    await supabase.from("wishlist_items").delete()
      .eq("wishlist_id", wishlistId).eq("product_id", productId);
    fetchAll();
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t("wishlists.title")}</h1>
        </div>

        {/* Create new */}
        <div className="flex gap-2 mb-8">
          <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder={t("wishlists.newPlaceholder")} className="max-w-xs"
            onKeyDown={e => e.key === "Enter" && createWishlist()} />
          <Button onClick={createWishlist} disabled={!newName.trim()}>
            <Plus className="h-4 w-4 mr-2" /> {t("wishlists.create")}
          </Button>
        </div>

        {wishlists.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("wishlists.empty")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {wishlists.map(wl => (
              <Card key={wl.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    {editingId === wl.id ? (
                      <div className="flex items-center gap-2">
                        <Input value={editName} onChange={e => setEditName(e.target.value)} className="h-8 w-48"
                          onKeyDown={e => e.key === "Enter" && renameWishlist(wl.id)} />
                        <Button size="sm" variant="ghost" onClick={() => renameWishlist(wl.id)}><Save className="h-3.5 w-3.5" /></Button>
                      </div>
                    ) : (
                      <CardTitle className="text-base flex items-center gap-2">
                        {wl.name}
                        <span className="text-sm font-normal text-muted-foreground">({wl.items.length})</span>
                      </CardTitle>
                    )}
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setEditingId(wl.id); setEditName(wl.name); }}>
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteWishlist(wl.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {wl.items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">{t("wishlists.noItems")}</p>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {wl.items.map((p: any, i: number) => (
                        <div key={p.id} className="relative">
                          <ProductCard product={p} index={i} />
                          <button
                            onClick={() => removeItem(wl.id, p.id)}
                            className="absolute top-2 end-2 z-10 h-7 w-7 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center hover:bg-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

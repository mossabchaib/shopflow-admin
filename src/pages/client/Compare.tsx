import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { GitCompareArrows, Loader2, Star, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export default function Compare() {
  const [searchParams] = useSearchParams();
  const { t } = useI18n();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    if (ids.length === 0) { setLoading(false); return; }
    const fetch = async () => {
      const { data } = await supabase
        .from("products")
        .select("*, product_images(image_url, is_primary), categories(name), product_sizes(size_label), product_colors(color_name, color_hex)")
        .in("id", ids);

      // Get review averages
      const { data: reviews } = await supabase.from("reviews").select("product_id, rating").in("product_id", ids).eq("status", "approved");
      const reviewMap = new Map<string, { total: number; count: number }>();
      (reviews || []).forEach(r => {
        const cur = reviewMap.get(r.product_id!) || { total: 0, count: 0 };
        cur.total += r.rating || 0;
        cur.count++;
        reviewMap.set(r.product_id!, cur);
      });

      setProducts((data || []).map(p => ({
        ...p,
        avgRating: reviewMap.get(p.id) ? reviewMap.get(p.id)!.total / reviewMap.get(p.id)!.count : 0,
        reviewCount: reviewMap.get(p.id)?.count || 0,
      })));
      setLoading(false);
    };
    fetch();
  }, [searchParams]);

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (products.length < 2) return (
    <div className="max-w-4xl mx-auto px-4 py-20 text-center">
      <GitCompareArrows className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
      <p className="text-muted-foreground mb-4">{t("compare.needTwo")}</p>
      <Button asChild><Link to="/shop">{t("compare.browseProducts")}</Link></Button>
    </div>
  );

  const getImg = (p: any) => p.product_images?.find((i: any) => i.is_primary)?.image_url || p.product_images?.[0]?.image_url || "/placeholder.svg";

  const rows = [
    { key: "image", label: "" },
    { key: "name", label: t("compare.name") },
    { key: "price", label: t("compare.price") },
    { key: "category", label: t("compare.category") },
    { key: "rating", label: t("compare.rating") },
    { key: "sizes", label: t("compare.sizes") },
    { key: "colors", label: t("compare.colors") },
    { key: "stock", label: t("compare.stock") },
    { key: "action", label: "" },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <GitCompareArrows className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t("compare.title")}</h1>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <tbody>
              {rows.map(row => (
                <tr key={row.key} className="border-b border-border">
                  <td className="py-3 px-3 text-sm font-medium text-muted-foreground w-28 align-middle">{row.label}</td>
                  {products.map(p => (
                    <td key={p.id} className="py-3 px-4 align-middle text-center min-w-[200px]">
                      {row.key === "image" && <img src={getImg(p)} alt="" className="h-32 w-32 mx-auto rounded-xl object-cover" />}
                      {row.key === "name" && <Link to={`/product/${p.id}`} className="text-sm font-semibold text-foreground hover:text-primary">{p.name}</Link>}
                      {row.key === "price" && (
                        <div>
                          <span className="text-lg font-bold text-success">${Number(p.discount_price || p.price).toFixed(2)}</span>
                          {p.discount_price && <span className="text-xs text-destructive line-through ms-2">${Number(p.price).toFixed(2)}</span>}
                        </div>
                      )}
                      {row.key === "category" && <span className="text-sm text-muted-foreground">{p.categories?.name || "—"}</span>}
                      {row.key === "rating" && (
                        <div className="flex items-center justify-center gap-1">
                          <div className="flex">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`h-3.5 w-3.5 ${s <= Math.round(p.avgRating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />)}</div>
                          <span className="text-xs text-muted-foreground">({p.reviewCount})</span>
                        </div>
                      )}
                      {row.key === "sizes" && <span className="text-xs text-muted-foreground">{p.product_sizes?.map((s: any) => s.size_label).join(", ") || "—"}</span>}
                      {row.key === "colors" && (
                        <div className="flex justify-center gap-1">
                          {p.product_colors?.map((c: any) => <span key={c.color_hex} className="h-5 w-5 rounded-full border" style={{ backgroundColor: c.color_hex }} title={c.color_name} />) || "—"}
                        </div>
                      )}
                      {row.key === "stock" && <span className={`text-sm font-medium ${(p.stock || 0) > 0 ? "text-success" : "text-destructive"}`}>{(p.stock || 0) > 0 ? t("compare.inStock") : t("compare.outOfStock")}</span>}
                      {row.key === "action" && <Button size="sm" asChild><Link to={`/product/${p.id}`}><ShoppingCart className="h-3.5 w-3.5 mr-1.5" />{t("product.viewProduct")}</Link></Button>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}

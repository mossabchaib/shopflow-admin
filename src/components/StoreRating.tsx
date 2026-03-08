import { useEffect, useState } from "react";
import { Star, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n";

export function StoreRating({ storeId }: { storeId: string }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useI18n();
  const [reviews, setReviews] = useState<any[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [myReview, setMyReview] = useState<any>(null);

  const fetchReviews = async () => {
    const { data } = await supabase
      .from("store_reviews")
      .select("*")
      .eq("store_id", storeId)
      .order("created_at", { ascending: false });
    if (!data) { setReviews([]); return; }
    const userIds = [...new Set(data.map(r => r.user_id))];
    const { data: profs } = await supabase.from("profiles").select("user_id, name").in("user_id", userIds);
    const profMap = new Map((profs || []).map(p => [p.user_id, p]));
    const enriched = data.map(r => ({ ...r, profile: profMap.get(r.user_id) }));
    setReviews(enriched);
    if (user) setMyReview(enriched.find(r => r.user_id === user.id) || null);
  };

  useEffect(() => { fetchReviews(); }, [storeId, user]);

  const submitReview = async () => {
    if (!user) { toast({ title: t("common.pleaseSignIn"), variant: "destructive" }); return; }
    setSubmitting(true);
    if (myReview) {
      await supabase.from("store_reviews").update({ rating, comment: comment.trim() || null }).eq("id", myReview.id);
    } else {
      await supabase.from("store_reviews").insert({ store_id: storeId, user_id: user.id, rating, comment: comment.trim() || null });
    }
    toast({ title: t("storeRating.submitted") });
    setComment("");
    await fetchReviews();
    setSubmitting(false);
  };

  const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-foreground">{avg.toFixed(1)}</div>
          <div className="flex gap-0.5 mt-1">
            {[1, 2, 3, 4, 5].map(s => (
              <Star key={s} className={`h-4 w-4 ${s <= Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">{reviews.length} {t("storeRating.reviews")}</p>
        </div>
      </div>

      {/* Form */}
      {user && (
        <div className="p-4 rounded-xl border border-border bg-muted/20">
          <p className="text-sm font-medium mb-2">{myReview ? t("storeRating.updateReview") : t("storeRating.writeReview")}</p>
          <div className="flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                <Star className={`h-6 w-6 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
              </button>
            ))}
          </div>
          <Textarea value={comment} onChange={e => setComment(e.target.value)} placeholder={t("storeRating.placeholder")} rows={2} className="mb-3 resize-none" />
          <Button onClick={submitReview} disabled={submitting} size="sm">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            {myReview ? t("storeRating.update") : t("storeRating.submit")}
          </Button>
        </div>
      )}

      {/* List */}
      {reviews.length === 0 ? (
        <p className="text-center text-muted-foreground py-4">{t("storeRating.noReviews")}</p>
      ) : (
        <div className="space-y-3">
          {reviews.map(r => (
            <div key={r.id} className="p-3 rounded-xl border border-border/50 bg-card">
              <div className="flex items-center gap-3 mb-1">
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">{(r.profile?.name || "?")?.[0]?.toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-foreground">{r.profile?.name || "User"}</span>
                <div className="flex gap-0.5 ms-auto">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className={`h-3 w-3 ${s <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
                  ))}
                </div>
              </div>
              {r.comment && <p className="text-sm text-muted-foreground ms-10">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

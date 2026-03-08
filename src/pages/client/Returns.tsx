import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { RotateCcw, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

const returnStatusColors: Record<string, string> = {
  requested: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  approved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
};

export default function Returns() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [returns, setReturns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [returnsRes, ordersRes] = await Promise.all([
      supabase.from("returns").select("*, orders(id, total, created_at, status)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("orders").select("id, total, created_at, status").eq("customer_id", user.id).in("status", ["delivered", "shipped"]).order("created_at", { ascending: false }),
    ]);
    setReturns(returnsRes.data || []);
    // Filter out orders that already have a return
    const returnedOrderIds = new Set((returnsRes.data || []).map((r: any) => r.order_id));
    setOrders((ordersRes.data || []).filter((o: any) => !returnedOrderIds.has(o.id)));
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const submitReturn = async () => {
    if (!user || !selectedOrder || !reason.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("returns").insert({
      order_id: selectedOrder,
      user_id: user.id,
      reason: reason.trim(),
    });
    if (error) toast.error(t("common.error"));
    else {
      toast.success(t("returns.submitted"));
      setSelectedOrder("");
      setReason("");
      fetchData();
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-8">
          <RotateCcw className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold text-foreground">{t("returns.title")}</h1>
        </div>

        {/* New return request */}
        {orders.length > 0 && (
          <Card className="mb-8">
            <CardHeader><CardTitle className="text-base">{t("returns.requestReturn")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{t("returns.selectOrder")}</label>
                <Select value={selectedOrder} onValueChange={setSelectedOrder}>
                  <SelectTrigger><SelectValue placeholder={t("returns.selectOrder")} /></SelectTrigger>
                  <SelectContent>
                    {orders.map(o => (
                      <SelectItem key={o.id} value={o.id}>
                        #{o.id.slice(0, 8)} — ${Number(o.total).toFixed(2)} — {new Date(o.created_at).toLocaleDateString()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">{t("returns.reason")}</label>
                <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder={t("returns.reasonPlaceholder")} rows={3} className="resize-none" />
              </div>
              <Button onClick={submitReturn} disabled={submitting || !selectedOrder || !reason.trim()}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                {t("returns.submit")}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Returns list */}
        {returns.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <RotateCcw className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">{t("returns.noReturns")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {returns.map(ret => (
              <Card key={ret.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-medium text-foreground">#{ret.order_id.slice(0, 8)}</span>
                        <Badge variant="secondary" className={returnStatusColors[ret.status] || ""}>{t(`returns.status.${ret.status}`)}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{ret.reason}</p>
                      {ret.admin_note && (
                        <p className="text-sm text-primary italic">{t("returns.adminNote")}: {ret.admin_note}</p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(ret.created_at).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

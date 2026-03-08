import { useEffect, useState } from "react";
import { Package, CreditCard, Truck, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const STATUS_STEPS = ["pending", "paid", "shipped", "delivered"];
const STATUS_ICONS: Record<string, any> = {
  pending: Package,
  paid: CreditCard,
  shipped: Truck,
  delivered: CheckCircle2,
  cancelled: XCircle,
};

export function OrderTracking({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const { t } = useI18n();
  const [tracking, setTracking] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("order_tracking").select("*").eq("order_id", orderId)
      .order("created_at").then(({ data }) => setTracking(data || []));
  }, [orderId]);

  if (currentStatus === "cancelled") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive">
        <XCircle className="h-5 w-5" />
        <span className="text-sm font-medium">{t("tracking.cancelled")}</span>
      </div>
    );
  }

  const currentIdx = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="py-4">
      <div className="flex items-center justify-between relative">
        {/* Connecting line */}
        <div className="absolute top-5 start-8 end-8 h-0.5 bg-border" />
        <div
          className="absolute top-5 start-8 h-0.5 bg-primary transition-all duration-500"
          style={{ width: `${currentIdx >= 0 ? (currentIdx / (STATUS_STEPS.length - 1)) * 100 : 0}%`, maxWidth: "calc(100% - 4rem)" }}
        />

        {STATUS_STEPS.map((step, i) => {
          const Icon = STATUS_ICONS[step];
          const isActive = i <= currentIdx;
          const isCurrent = i === currentIdx;
          const trackingEntry = tracking.find(t => t.status === step);

          return (
            <div key={step} className="flex flex-col items-center z-10 relative">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300",
                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                isCurrent && "ring-4 ring-primary/20 scale-110"
              )}>
                <Icon className="h-4 w-4" />
              </div>
              <span className={cn(
                "text-xs font-medium mt-2 text-center",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {t(`tracking.${step}`)}
              </span>
              {trackingEntry && (
                <span className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(trackingEntry.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

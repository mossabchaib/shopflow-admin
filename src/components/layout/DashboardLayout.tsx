import { ReactNode, useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Moon, Sun, Bell, LogOut, ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Lang } from "@/lib/i18n";

interface Notification {
  id: string;
  type: "order" | "stock";
  message: string;
  detail: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isDark, setIsDark] = useState(false);
  const { signOut, user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  useEffect(() => {
    const fetchNotifications = async () => {
      setNotifLoading(true);
      const notifs: Notification[] = [];

      const [pendingRes, lowStockRes] = await Promise.all([
        supabase.from("orders").select("id, total, created_at").eq("status", "pending").order("created_at", { ascending: false }).limit(10),
        supabase.from("product_variants").select("stock, product_sizes(size_label), product_colors(color_name), products(name)").lt("stock", 5).order("stock").limit(10),
      ]);

      (pendingRes.data || []).forEach((o: any) => {
        notifs.push({
          id: `order-${o.id}`,
          type: "order",
          message: t("admin.newPendingOrder"),
          detail: `$${Number(o.total).toFixed(2)} — ${new Date(o.created_at).toLocaleDateString()}`,
        });
      });

      (lowStockRes.data || []).forEach((v: any, i: number) => {
        const productName = v.products?.name || "—";
        const sizeName = v.product_sizes?.size_label || "";
        const colorName = v.product_colors?.color_name || "";
        notifs.push({
          id: `stock-${i}`,
          type: "stock",
          message: t("admin.lowStockWarning"),
          detail: `${productName} ${sizeName} ${colorName} — ${v.stock} ${t("admin.left")}`,
        });
      });

      setNotifications(notifs);
      setNotifLoading(false);
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [lang]);

  const notifCount = notifications.length;

  const isRtl = lang === "ar";

  return (
    <SidebarProvider>
      <div className={`min-h-screen flex w-full ${isRtl ? "flex-row-reverse" : ""}`}>
        <AppSidebar side={isRtl ? "right" : "left"} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between border-b bg-card px-4 lg:px-6 sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              {/* Language selector */}
              <Select value={lang} onValueChange={(v) => setLang(v as Lang)}>
                <SelectTrigger className="w-[80px] h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="fr">FR</SelectItem>
                  <SelectItem value="ar">AR</SelectItem>
                </SelectContent>
              </Select>

              {/* Notifications */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground">
                    <Bell className="h-5 w-5" />
                    {notifCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                        {notifCount > 99 ? "99+" : notifCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-0" align="end">
                  <div className="p-3 border-b font-semibold text-sm">{t("admin.notifications")}</div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-sm text-muted-foreground text-center">{t("admin.noNotifications")}</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="flex items-start gap-3 p-3 border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${n.type === "order" ? "bg-primary/10 text-primary" : "bg-warning/10 text-warning"}`}>
                            {n.type === "order" ? <ShoppingCart className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{n.message}</p>
                            <p className="text-xs text-muted-foreground truncate">{n.detail}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Button variant="ghost" size="icon" onClick={() => setIsDark(!isDark)} className="text-muted-foreground">
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} className="text-muted-foreground" title={t("nav.signout")}>
                <LogOut className="h-5 w-5" />
              </Button>
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold ms-2">
                {user?.email?.[0]?.toUpperCase() || "A"}
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

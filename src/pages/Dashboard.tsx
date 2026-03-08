import { useState, useEffect } from "react";
import {
  Store, MessageSquare, BarChart3, Users, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useUserRole } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ stores: 0, pendingStores: 0, unreadChats: 0, totalSellers: 0 });
  const [pendingStores, setPendingStores] = useState<any[]>([]);
  const { t } = useI18n();
  const { role } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const [storesRes, pendingRes, sellersRes, chatsRes] = await Promise.all([
        supabase.from("stores").select("id", { count: "exact", head: true }),
        supabase.from("stores").select("id, store_name, slug, owner_id, created_at, status").eq("status", "pending").order("created_at", { ascending: false }).limit(5),
        supabase.from("user_roles").select("id", { count: "exact", head: true }).eq("role", "seller"),
        supabase.from("chat_messages").select("id", { count: "exact", head: true }).eq("is_read", false),
      ]);

      setStats({
        stores: storesRes.count || 0,
        pendingStores: (pendingRes.data || []).length,
        unreadChats: chatsRes.count || 0,
        totalSellers: sellersRes.count || 0,
      });
      setPendingStores(pendingRes.data || []);
      setLoading(false);
    };
    fetchData();
  }, [role]);

  const statCards = [
    { label: t("admin.totalStores"), value: String(stats.stores), icon: Store, color: "bg-primary/10 text-primary", link: "/admin/stores" },
    { label: t("admin.pendingStores"), value: String(stats.pendingStores), icon: Store, color: "bg-warning/10 text-warning", link: "/admin/stores" },
    { label: t("admin.totalSellers"), value: String(stats.totalSellers), icon: Users, color: "bg-success/10 text-success", link: "/admin/stores" },
    { label: t("admin.unreadMessages"), value: String(stats.unreadChats), icon: MessageSquare, color: "bg-secondary/10 text-secondary", link: "/admin/chat" },
  ];

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("admin.dashboard")}</h1>
        <p className="text-muted-foreground text-sm mt-1">{t("admin.welcomeBack")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div
            key={stat.label}
            className="stat-card cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => navigate(stat.link)}
          >
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Store Requests */}
      {pendingStores.length > 0 && (
        <div className="dashboard-card">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{t("admin.pendingStoreRequests")}</h2>
            <button
              onClick={() => navigate("/admin/stores")}
              className="text-sm text-primary hover:underline"
            >
              {t("admin.viewAll")}
            </button>
          </div>
          <div className="divide-y">
            {pendingStores.map((store: any) => (
              <div key={store.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{store.store_name}</p>
                  <p className="text-xs text-muted-foreground">/{store.slug} — {new Date(store.created_at).toLocaleDateString()}</p>
                </div>
                <span className="status-badge bg-warning/10 text-warning">{t("admin.pending")}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: t("admin.manageStores"), icon: Store, link: "/admin/stores", color: "bg-primary/10 text-primary" },
          { label: t("admin.viewAnalytics"), icon: BarChart3, link: "/admin/analytics", color: "bg-success/10 text-success" },
          { label: t("admin.openChat"), icon: MessageSquare, link: "/admin/chat", color: "bg-secondary/10 text-secondary" },
        ].map((action) => (
          <div
            key={action.label}
            onClick={() => navigate(action.link)}
            className="dashboard-card p-6 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${action.color}`}>
              <action.icon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-foreground">{action.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;

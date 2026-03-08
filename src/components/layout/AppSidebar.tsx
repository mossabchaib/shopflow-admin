import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  FolderTree,
  BarChart3,
  Ticket,
  Store,
  Truck,
  Settings,
  MessageSquare,
  PieChart,
  Tag,
  BarChart,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useUserRole } from "@/hooks/useStore";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const adminMenuItems = [
  { titleKey: "sidebar.dashboard", url: "/admin", icon: LayoutDashboard },
  { titleKey: "sidebar.stores", url: "/admin/stores", icon: Store },
  { titleKey: "sidebar.analytics", url: "/admin/analytics", icon: BarChart3 },
  { titleKey: "sidebar.chat", url: "/admin/chat", icon: MessageSquare },
];

const sellerMenuItems = [
  { titleKey: "sidebar.dashboard", url: "/admin", icon: LayoutDashboard },
  { titleKey: "seller.sellerOverview", url: "/admin/seller-dashboard", icon: PieChart },
  { titleKey: "sidebar.products", url: "/admin/products", icon: Package },
  { titleKey: "sidebar.orders", url: "/admin/orders", icon: ShoppingCart },
  { titleKey: "seller.storeCoupons", url: "/admin/seller-coupons", icon: Tag },
  { titleKey: "seller.sellerAnalytics", url: "/admin/seller-analytics", icon: BarChart },
  { titleKey: "sidebar.customers", url: "/admin/customers", icon: Users },
  { titleKey: "sidebar.categories", url: "/admin/categories", icon: FolderTree },
  { titleKey: "sidebar.suppliers", url: "/admin/suppliers", icon: Truck },
  { titleKey: "sidebar.analytics", url: "/admin/analytics", icon: BarChart3 },
  { titleKey: "sidebar.discounts", url: "/admin/discounts", icon: Ticket },
  { titleKey: "seller.storeSettings", url: "/admin/store-settings", icon: Settings },
  { titleKey: "sidebar.chat", url: "/admin/chat", icon: MessageSquare },
];

export function AppSidebar({ side = "left" }: { side?: "left" | "right" }) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { t } = useI18n();
  const { role } = useUserRole();

  const menuItems = role === "admin" ? adminMenuItems : sellerMenuItems;

  return (
    <Sidebar collapsible="icon" className={side === "right" ? "border-l-0" : "border-r-0"} side={side}>
      <div className="h-16 flex items-center gap-3 px-4 border-b border-sidebar-border">
        <div className="h-9 w-9 rounded-lg bg-sidebar-primary flex items-center justify-center flex-shrink-0">
          <Store className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-sm font-bold text-sidebar-foreground truncate">
              {role === "admin" ? "Admin Panel" : t("seller.myStore")}
            </h1>
            <p className="text-xs text-sidebar-muted truncate">
              {role === "admin" ? t("sidebar.ecommerceDashboard") : t("seller.sellerDashboard")}
            </p>
          </div>
        )}
      </div>
      <SidebarContent className="pt-4 px-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const isActive =
                  item.url === "/admin"
                    ? location.pathname === "/admin"
                    : location.pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.titleKey}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/admin"}
                        className={`sidebar-item ${isActive ? "sidebar-item-active" : "sidebar-item-inactive"}`}
                        activeClassName=""
                      >
                        <item.icon className="h-5 w-5 flex-shrink-0" />
                        {!collapsed && <span>{t(item.titleKey)}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, Menu, X, Store, LogOut, LayoutDashboard, Globe, Sun, Moon, UserCircle, List, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useI18n, Lang } from "@/lib/i18n";
import { useGuestCart } from "@/hooks/useGuestCart";
import { useTheme } from "next-themes";
import { NotificationBell } from "@/components/NotificationBell";

const languages: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

export function ClientNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const { count: guestCartCount } = useGuestCart();
  const { theme, setTheme } = useTheme();

  const { data: dbCartCount } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { data } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id);
      return data ? data.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
    },
    enabled: !!user,
  });

  const cartCount = user ? (dbCartCount || 0) : guestCartCount;

  const { data: dashboardRole } = useQuery({
    queryKey: ["dashboard-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const roles = (data || []).map((r: any) => r.role);
      if (roles.includes("admin")) return "admin";
      if (roles.includes("seller")) return "seller";
      return null;
    },
    enabled: !!user,
  });

  const links = [
    { href: "/", label: t("nav.home") },
    { href: "/shop", label: t("nav.shop") },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">StoreAdmin</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            {links.map(l => (
              <Link key={l.href} to={l.href} className={`text-sm font-medium transition-colors ${isActive(l.href) ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>

            {/* Language Switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {languages.map(l => (
                  <DropdownMenuItem
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={lang === l.code ? "bg-primary/10 text-primary" : ""}
                  >
                    {l.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {user && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/account")} title={t("nav.account")}>
                <UserCircle className={`h-4 w-4 ${isActive("/account") ? "text-primary" : ""}`} />
              </Button>
            )}

            {user && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/favorites")}>
                <Heart className={`h-4 w-4 ${isActive("/favorites") ? "fill-primary text-primary" : ""}`} />
              </Button>
            )}

            <Button variant="ghost" size="icon" className="relative h-9 w-9" onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-4 w-4" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Button>

            {user && dashboardRole && (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate("/admin")} title={t("nav.dashboard")}>
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            )}

            {user ? (
              <Button variant="ghost" size="icon" className="h-9 w-9" onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={() => navigate("/auth")}>{t("nav.signin")}</Button>
            )}

            <Button variant="ghost" size="icon" className="md:hidden h-9 w-9" onClick={() => setMobileOpen(!mobileOpen)}>
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 space-y-2">
          {links.map(l => (
            <Link key={l.href} to={l.href} onClick={() => setMobileOpen(false)} className={`block py-2 px-3 rounded-lg text-sm font-medium ${isActive(l.href) ? "bg-primary/10 text-primary" : "text-muted-foreground"}`}>
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

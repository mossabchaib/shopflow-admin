import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  ShoppingCart,
  Heart,
  Menu,
  X,
  Store,
  LogOut,
  LayoutDashboard,
  Globe,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useI18n, Lang } from "@/lib/i18n";
import { useGuestCart } from "@/hooks/useGuestCart";

const languages: { code: Lang; label: string }[] = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "ar", label: "العربية" },
];

export function ClientNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const { user, signOut } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const { t, lang, setLang } = useI18n();

  const { count: guestCartCount } = useGuestCart();

  /*
   * Database cart count
   */
  const { data: dbCartCount } = useQuery({
    queryKey: ["cart-count", user?.id],

    queryFn: async () => {
      if (!user) return 0;

      const { count, error } = await supabase
        .from("cart_items")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("user_id", user.id);

      if (error) {
        console.error("CART COUNT ERROR:", error);
        return 0;
      }

      return count || 0;
    },

    enabled: !!user,
  });

  const cartCount = user
    ? dbCartCount || 0
    : guestCartCount;

  /*
   * Admin check
   */
  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],

    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) {
        console.error("ADMIN ROLE ERROR:", error);
        return false;
      }

      return !!data;
    },

    enabled: !!user,
  });

  const links = [
    {
      href: "/",
      label: t("nav.home"),
    },
    {
      href: "/shop",
      label: t("nav.shop"),
    },
  ];

  const isActive = (path: string) =>
    location.pathname === path;

  /*
   * Centralized logout
   */
  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/", { replace: true });
    } catch (error) {
      console.error("LOGOUT ERROR:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2"
          >
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>

            <span className="font-bold text-lg text-foreground">
              StoreAdmin
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {links.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5">

            {/* Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                >
                  <Globe className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                {languages.map((language) => (
                  <DropdownMenuItem
                    key={language.code}
                    onClick={() => setLang(language.code)}
                    className={
                      lang === language.code
                        ? "bg-primary/10 text-primary"
                        : ""
                    }
                  >
                    {language.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Favorites */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => navigate("/favorites")}
              >
                <Heart
                  className={`h-4 w-4 ${
                    isActive("/favorites")
                      ? "fill-primary text-primary"
                      : ""
                  }`}
                />
              </Button>
            )}

            {/* Cart */}
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={() => navigate("/cart")}
            >
              <ShoppingCart className="h-4 w-4" />

              {cartCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-medium">
                  {cartCount}
                </span>
              )}
            </Button>

            {/* Admin Dashboard */}
            {user && isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => navigate("/admin")}
                title={t("nav.dashboard")}
              >
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            )}

            {/* Authentication */}
            {user ? (
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate("/auth")}
              >
                {t("nav.signin")}
              </Button>
            )}

            {/* Mobile menu */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-9 w-9"
              onClick={() => setMobileOpen((prev) => !prev)}
            >
              {mobileOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>

          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 space-y-2">
          {links.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block py-2 px-3 rounded-lg text-sm font-medium ${
                isActive(link.href)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
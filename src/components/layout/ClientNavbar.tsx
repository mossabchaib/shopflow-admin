import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  ShoppingCart,
  Heart,
  Store,
  LayoutDashboard,
  Globe,
  Home,
  User,
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
  const { user } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  const { t, lang, setLang } = useI18n();

  const { count: guestCartCount } = useGuestCart();

  /* Cart count */
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

  /* Admin check */
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

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  return (
    <>
      {/* =====================================================
          TOP NAVBAR
      ====================================================== */}
      <nav className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-lg">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 w-full items-center justify-between">

            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>

              <span className="text-lg font-bold text-foreground">
                Unkut
              </span>
            </Link>

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

              {/* Desktop Favorites */}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex h-9 w-9"
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

              {/* Desktop Cart */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex relative h-9 w-9"
                onClick={() => navigate("/cart")}
              >
                <ShoppingCart className="h-4 w-4" />

                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Button>

              {/* Admin */}
              {user && isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="hidden md:flex h-9 w-9"
                  onClick={() => navigate("/admin")}
                  title={t("nav.dashboard")}
                >
                  <LayoutDashboard className="h-4 w-4" />
                </Button>
              )}

              {/* Account / Sign In */}
              {user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => navigate("/account")}
                  title="Account"
                >
                  <User
                    className={`h-4 w-4 ${
                      isActive("/account")
                        ? "text-primary"
                        : ""
                    }`}
                  />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate("/auth")}
                >
                  {t("nav.signin")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* =====================================================
          MOBILE BOTTOM TABS
      ====================================================== */}
      <nav
        className="
          fixed
          bottom-0
          left-0
          right-0
          z-[100]
          w-full
          border-t
          bg-card/95
          backdrop-blur-xl
          md:hidden
        "
      >
        <div className="flex h-16 w-full items-center">

          {/* HOME */}
          <Link
            to="/"
            className={`flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              isActive("/")
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Home className="h-5 w-5" />

            <span>{t("nav.home")}</span>
          </Link>

          {/* SHOP */}
          <Link
            to="/shop"
            className={`flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              isActive("/shop")
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <Store className="h-5 w-5" />

            <span>{t("nav.shop")}</span>
          </Link>

          {/* CART */}
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className={`relative flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              isActive("/cart")
                ? "text-primary"
                : "text-muted-foreground"
            }`}
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />

              {cartCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-semibold text-primary-foreground">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </div>

            <span>Cart</span>
          </button>

          {/* FAVORITES */}
          {user && (
            <Link
              to="/favorites"
              className={`flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                isActive("/favorites")
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <Heart
                className={`h-5 w-5 ${
                  isActive("/favorites")
                    ? "fill-primary"
                    : ""
                }`}
              />

              <span>Favorites</span>
            </Link>
          )}

          {/* ACCOUNT */}
          {user && (
            <Link
              to="/account"
              className={`flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
                isActive("/account")
                  ? "text-primary"
                  : "text-muted-foreground"
              }`}
            >
              <User className="h-5 w-5" />

              <span>Account</span>
            </Link>
          )}
        </div>

        {/* iPhone safe area */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}

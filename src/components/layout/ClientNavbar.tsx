import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  ShoppingCart,
  Heart,
  Store,
  LayoutDashboard,
  Globe,
  Home,
  User,
  Menu,
  X,
  ChevronRight,
  LogIn,
  LogOut,
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
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { t, lang, setLang } = useI18n();
  const { count: guestCartCount } = useGuestCart();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cart count
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

  const cartCount = user ? dbCartCount || 0 : guestCartCount;

  // Admin check
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

  const isActive = (path: string) => {
    if (path === "/") {
      return location.pathname === "/";
    }

    return (
      location.pathname === path ||
      location.pathname.startsWith(`${path}/`)
    );
  };

  const closeSidebar = () => setSidebarOpen(false);

  const sidebarNavigate = (path: string) => {
    closeSidebar();
    navigate(path);
  };

  return (
    <>
      {/* ================= DESKTOP NAVBAR ================= */}
      <nav className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-lg">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* MOBILE HEADER */}
          <div className="relative flex h-16 items-center justify-between md:hidden">
            {/* Left: Sidebar Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="relative z-10 h-10 w-10 rounded-xl"
              aria-label="Open navigation menu"
            >
              <Menu className="h-6 w-6" />
            </Button>

            {/* Center: Logo */}
            <Link
              to="/"
              onClick={closeSidebar}
              aria-label="Ü R V O X Home"
              className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center"
            >
              <img
                src="/Logo.png"
                alt="Ü R V O X"
                className="h-9 w-9 object-contain"
              />

              <span className="ml-2 whitespace-nowrap text-base font-bold tracking-[0.12em] text-foreground">
                Ü R V O X
              </span>
            </Link>

            {/* Right: Language */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative z-10 h-10 w-10 rounded-xl"
                  aria-label="Change language"
                >
                  <Globe className="h-5 w-5" />
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
          </div>

          {/* DESKTOP HEADER */}
          <div className="hidden h-16 w-full items-center justify-between md:flex">
            {/* Logo */}
            <Link
              to="/"
              className="flex shrink-0 items-center gap-3"
              aria-label="Ü R V O X Home"
            >
              <img
                src="/Logo.png"
                alt="Ü R V O X Logo"
                className="h-9 w-9 object-contain"
              />

              <span className="text-lg font-bold tracking-[0.18em] text-foreground">
                Ü R V O X
              </span>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-6">
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

            {/* Desktop Actions */}
            <div className="flex items-center gap-1.5">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9"
                    aria-label="Change language"
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

              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => navigate("/favorites")}
                  title="Favorites"
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

              <Button
                variant="ghost"
                size="icon"
                className="relative h-9 w-9"
                onClick={() => navigate("/cart")}
                title="Cart"
              >
                <ShoppingCart className="h-4 w-4" />

                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Button>

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

              {user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={async () => {
                    await signOut();
                  }}
                  title={t("nav.signout")}
                  aria-label={t("nav.signout")}
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              ) : (
                <Button size="sm" onClick={() => navigate("/auth")}>
                  {t("nav.signin")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* ================= MOBILE SIDEBAR ================= */}

      {/* Backdrop */}
      <div
        onClick={closeSidebar}
        aria-hidden="true"
        className={`fixed inset-0 z-[110] bg-black/50 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          sidebarOpen
            ? "visible opacity-100"
            : "invisible pointer-events-none opacity-0"
        }`}
      />

      {/* Sidebar Panel */}
      <aside
        aria-label="Main navigation"
        aria-hidden={!sidebarOpen}
        className={`fixed bottom-0 left-0 top-0 z-[120] flex w-[min(85vw,340px)] flex-col border-r bg-background shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b px-5 py-5">
          <Link
            to="/"
            onClick={closeSidebar}
            className="flex items-center gap-3"
          >
            <img
              src="/Logo.png"
              alt="Ü R V O X"
              className="h-10 w-10 object-contain"
            />

            <div>
              <p className="text-sm font-bold tracking-[0.14em]">
                Ü R V O X
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Your everyday store
              </p>
            </div>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={closeSidebar}
            className="h-9 w-9 rounded-xl"
            aria-label="Close navigation menu"
            tabIndex={sidebarOpen ? 0 : -1}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* User Information (display only, not a link) */}
        {user && (
          <div className="mx-4 mt-5 rounded-2xl border bg-muted/40 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <User className="h-5 w-5" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-semibold">My Account</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* All Routes */}
        <div className="flex-1 overflow-y-auto px-4 py-5">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Menu
          </p>

          <div className="space-y-1.5">
            {/* Home */}
            <button
              type="button"
              onClick={() => sidebarNavigate("/")}
              tabIndex={sidebarOpen ? 0 : -1}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                isActive("/")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Home className="h-[19px] w-[19px]" />
              <span className="flex-1 text-left">{t("nav.home")}</span>
              <ChevronRight className="h-4 w-4 opacity-60" />
            </button>

            {/* Shop */}
            <button
              type="button"
              onClick={() => sidebarNavigate("/shop")}
              tabIndex={sidebarOpen ? 0 : -1}
              className={`group flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                isActive("/shop")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <Store className="h-[19px] w-[19px]" />
              <span className="flex-1 text-left">{t("nav.shop")}</span>
              <ChevronRight className="h-4 w-4 opacity-60" />
            </button>

            {/* Cart */}
            <button
              type="button"
              onClick={() => sidebarNavigate("/cart")}
              tabIndex={sidebarOpen ? 0 : -1}
              className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                isActive("/cart")
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <ShoppingCart className="h-[19px] w-[19px]" />
              <span className="flex-1 text-left">Cart</span>

              {cartCount > 0 && (
                <span
                  className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-semibold ${
                    isActive("/cart")
                      ? "bg-primary-foreground/20 text-primary-foreground"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            {/* Favorites */}
            {user && (
              <button
                type="button"
                onClick={() => sidebarNavigate("/favorites")}
                tabIndex={sidebarOpen ? 0 : -1}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                  isActive("/favorites")
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-foreground hover:bg-muted"
                }`}
              >
                <Heart className="h-[19px] w-[19px]" />
                <span className="flex-1 text-left">Favorites</span>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </button>
            )}

            {/* Logout */}
            {user && (
              <button
                type="button"
                onClick={async () => {
                  closeSidebar();
                  await signOut();
                }}
                tabIndex={sidebarOpen ? 0 : -1}
                className="group mt-2 flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-[19px] w-[19px]" />
                <span className="flex-1 text-left">{t("nav.signout")}</span>
                <ChevronRight className="h-4 w-4 opacity-60" />
              </button>
            )}

            {/* Admin Dashboard */}
            {user && isAdmin && (
              <>
                <div className="my-4 border-t" />

                <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                  Administration
                </p>

                <button
                  type="button"
                  onClick={() => sidebarNavigate("/admin")}
                  tabIndex={sidebarOpen ? 0 : -1}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-sm font-medium transition-all ${
                    isActive("/admin")
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-foreground hover:bg-muted"
                  }`}
                >
                  <LayoutDashboard className="h-[19px] w-[19px]" />
                  <span className="flex-1 text-left">
                    {t("nav.dashboard")}
                  </span>
                  <ChevronRight className="h-4 w-4 opacity-60" />
                </button>
              </>
            )}

            {/* Sign In */}
            {!user && (
              <>
                <div className="my-4 border-t" />

                <button
                  type="button"
                  onClick={() => sidebarNavigate("/auth")}
                  tabIndex={sidebarOpen ? 0 : -1}
                  className="flex w-full items-center gap-3 rounded-xl bg-primary px-3.5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                >
                  <LogIn className="h-[19px] w-[19px]" />
                  <span className="flex-1 text-left">{t("nav.signin")}</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
                <Globe className="h-4 w-4 text-muted-foreground" />
              </div>

              <div>
                <p className="text-sm font-medium">Language</p>
                <p className="text-xs text-muted-foreground">
                  {languages.find((language) => language.code === lang)?.label}
                </p>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-lg"
                  tabIndex={sidebarOpen ? 0 : -1}
                >
                  Change
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
          </div>

          <p className="mt-5 text-center text-[10px] text-muted-foreground">
            © {new Date().getFullYear()} Ü R V O X
          </p>
        </div>
      </aside>

      {/* ================= MOBILE BOTTOM TABS ================= */}
      <nav
        aria-label="Mobile bottom navigation"
        className="fixed bottom-0 left-0 right-0 z-[100] w-full border-t bg-card/95 backdrop-blur-xl md:hidden"
      >
        <div className="flex h-16 w-full items-center">
          {/* Home */}
          <Link
            to="/"
            className={`flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              isActive("/") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Home className="h-5 w-5" />
            <span>{t("nav.home")}</span>
          </Link>

          {/* Shop */}
          <Link
            to="/shop"
            className={`flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              isActive("/shop") ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Store className="h-5 w-5" />
            <span>{t("nav.shop")}</span>
          </Link>

          {/* Cart */}
          <button
            type="button"
            onClick={() => navigate("/cart")}
            className={`relative flex h-full flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium ${
              isActive("/cart") ? "text-primary" : "text-muted-foreground"
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

          {/* Favorites */}
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
                  isActive("/favorites") ? "fill-primary" : ""
                }`}
              />
              <span>Favorites</span>
            </Link>
          )}
        </div>

        {/* iPhone Safe Area */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
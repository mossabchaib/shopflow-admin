import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart, Heart, User, Menu, X, Store, LogOut, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function ClientNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const { data: cartCount } = useQuery({
    queryKey: ["cart-count", user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await supabase.from("cart_items").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      return count || 0;
    },
    enabled: !!user,
  });

  const { data: isAdmin } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const links = [
    { href: "/", label: "Home" },
    { href: "/shop", label: "Shop" },
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

          <div className="flex items-center gap-2">
            {user && (
              <>
                <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/favorites")}>
                  <Heart className={`h-5 w-5 ${isActive("/favorites") ? "fill-primary text-primary" : ""}`} />
                </Button>
                <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/cart")}>
                  <ShoppingCart className="h-5 w-5" />
                  {(cartCount || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">{cartCount}</span>
                  )}
                </Button>
                {isAdmin && (
                  <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} title="Admin Dashboard">
                    <LayoutDashboard className="h-5 w-5" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={async () => { await supabase.auth.signOut(); navigate("/"); }}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </>
            )}
            {!user && (
              <Button size="sm" onClick={() => navigate("/auth")}>Sign In</Button>
            )}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
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

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { I18nProvider } from "@/lib/i18n";
import { ThemeProvider } from "next-themes";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClientLayout } from "@/components/layout/ClientLayout";
import { StoreLayout } from "@/components/layout/StoreLayout";
import { CompareProvider, CompareBar } from "@/components/ProductComparison";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Categories from "./pages/Categories";
import Analytics from "./pages/Analytics";
import Discounts from "./pages/Discounts";
import Suppliers from "./pages/Suppliers";
import Chat from "./pages/Chat";
import Stores from "./pages/admin/Stores";
import Auth from "./pages/Auth";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";
import Home from "./pages/client/Home";
import Shop from "./pages/client/Shop";
import ProductDetail from "./pages/client/ProductDetail";
import Cart from "./pages/client/Cart";
import Favorites from "./pages/client/Favorites";
import Checkout from "./pages/client/Checkout";
import StoreHome from "./pages/client/StoreHome";
import StoreShop from "./pages/client/StoreShop";
import StoreProductDetail from "./pages/client/StoreProductDetail";
import Account from "./pages/client/Account";
import Wishlists from "./pages/client/Wishlists";
import Returns from "./pages/client/Returns";
import Compare from "./pages/client/Compare";
import ClientStores from "./pages/client/Stores";
import MyOrders from "./pages/client/MyOrders";
import StoreSettings from "./pages/seller/StoreSettings";
import SellerDashboard from "./pages/seller/SellerDashboard";
import SellerCoupons from "./pages/seller/SellerCoupons";
import RequestStore from "./pages/seller/RequestStore";
import Reviews from "./pages/Reviews";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SellerAnalytics from "./pages/seller/SellerAnalytics";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const queryClient = new QueryClient();

function AdminOrSellerRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ["user-role-route", user?.id],
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
  if (loading || roleLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!userRole) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin-route", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });
  if (loading || roleLoading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { data: userRole, isLoading: roleLoading } = useQuery({
    queryKey: ["user-role-auth-route", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
      const roles = (data || []).map((r: any) => r.role);
      if (roles.includes("admin")) return "admin";
      if (roles.includes("seller")) return "seller";
      return "customer";
    },
    enabled: !!user,
  });
  if (loading || (user && roleLoading)) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user && (userRole === "admin" || userRole === "seller")) return <Navigate to="/admin" replace />;
  if (user) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <I18nProvider>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <CompareProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/auth" element={<AuthRoute><ClientLayout><Auth /></ClientLayout></AuthRoute>} />
                  <Route path="/register" element={<AuthRoute><ClientLayout><Register /></ClientLayout></AuthRoute>} />

                  {/* Admin + Seller shared routes */}
                  <Route path="/admin" element={<AdminOrSellerRoute><DashboardLayout><Dashboard /></DashboardLayout></AdminOrSellerRoute>} />
                  <Route path="/admin/products" element={<AdminOrSellerRoute><DashboardLayout><Products /></DashboardLayout></AdminOrSellerRoute>} />
                  <Route path="/admin/orders" element={<AdminOrSellerRoute><DashboardLayout><Orders /></DashboardLayout></AdminOrSellerRoute>} />
                  <Route path="/admin/store-settings" element={<AdminOrSellerRoute><DashboardLayout><StoreSettings /></DashboardLayout></AdminOrSellerRoute>} />
                  <Route path="/admin/reviews" element={<AdminOrSellerRoute><DashboardLayout><Reviews /></DashboardLayout></AdminOrSellerRoute>} />
                  <Route path="/admin/seller-dashboard" element={<AdminOrSellerRoute><DashboardLayout><SellerDashboard /></DashboardLayout></AdminOrSellerRoute>} />
                  <Route path="/admin/seller-coupons" element={<AdminOrSellerRoute><DashboardLayout><SellerCoupons /></DashboardLayout></AdminOrSellerRoute>} />

                  {/* Admin-only routes */}
                  <Route path="/admin/stores" element={<AdminRoute><DashboardLayout><Stores /></DashboardLayout></AdminRoute>} />

                  {/* Admin + Seller shared routes */}
                  <Route path="/admin/customers" element={<AdminOrSellerRoute><DashboardLayout><Customers /></DashboardLayout></AdminOrSellerRoute>} />
                  <Route path="/admin/categories" element={<AdminOrSellerRoute><DashboardLayout><Categories /></DashboardLayout></AdminOrSellerRoute>} />
                  <Route path="/admin/analytics" element={<AdminOrSellerRoute><DashboardLayout><Analytics /></DashboardLayout></AdminOrSellerRoute>} />
                  <Route path="/admin/discounts" element={<AdminOrSellerRoute><DashboardLayout><Discounts /></DashboardLayout></AdminOrSellerRoute>} />
                  <Route path="/admin/suppliers" element={<AdminOrSellerRoute><DashboardLayout><Suppliers /></DashboardLayout></AdminOrSellerRoute>} />
                  <Route path="/admin/chat" element={<AdminOrSellerRoute><DashboardLayout><Chat /></DashboardLayout></AdminOrSellerRoute>} />

                  {/* Store sub-site routes */}
                  <Route path="/store/:slug" element={<StoreLayout><StoreHome /></StoreLayout>} />
                  <Route path="/store/:slug/shop" element={<StoreLayout><StoreShop /></StoreLayout>} />
                  <Route path="/store/:slug/product/:productId" element={<StoreLayout><StoreProductDetail /></StoreLayout>} />

                  {/* Main marketplace client routes */}
                  <Route path="/" element={<ClientLayout><Home /></ClientLayout>} />
                  <Route path="/shop" element={<ClientLayout><Shop /></ClientLayout>} />
                  <Route path="/product/:id" element={<ClientLayout><ProductDetail /></ClientLayout>} />
                  <Route path="/cart" element={<ClientLayout><Cart /></ClientLayout>} />
                  <Route path="/checkout" element={<ClientLayout><Checkout /></ClientLayout>} />
                  <Route path="/favorites" element={<ProtectedRoute><ClientLayout><Favorites /></ClientLayout></ProtectedRoute>} />
                  <Route path="/wishlists" element={<ProtectedRoute><ClientLayout><Wishlists /></ClientLayout></ProtectedRoute>} />
                  <Route path="/returns" element={<ProtectedRoute><ClientLayout><Returns /></ClientLayout></ProtectedRoute>} />
                  <Route path="/my-orders" element={<ProtectedRoute><ClientLayout><MyOrders /></ClientLayout></ProtectedRoute>} />
                  <Route path="/stores" element={<ClientLayout><ClientStores /></ClientLayout>} />
                  <Route path="/compare" element={<ClientLayout><Compare /></ClientLayout>} />
                  <Route path="/account" element={<ProtectedRoute><ClientLayout><Account /></ClientLayout></ProtectedRoute>} />
                  <Route path="/request-store" element={<ProtectedRoute><ClientLayout><RequestStore /></ClientLayout></ProtectedRoute>} />

                  <Route path="*" element={<ClientLayout><NotFound /></ClientLayout>} />
                </Routes>
                <CompareBar />
              </BrowserRouter>
            </TooltipProvider>
          </CompareProvider>
        </ThemeProvider>
      </I18nProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

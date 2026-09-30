import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { I18nProvider } from "@/lib/i18n";

import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClientLayout } from "@/components/layout/ClientLayout";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Categories from "./pages/Categories";
import Analytics from "./pages/Analytics";
import Discounts from "./pages/Discounts";
import Suppliers from "./pages/Suppliers";

import Auth from "./pages/Auth";
import Register from "./pages/Register";
import NotFound from "./pages/NotFound";

import Home from "./pages/client/Home";
import Shop from "./pages/client/Shop";
import ProductDetail from "./pages/client/ProductDetail";
import Cart from "./pages/client/Cart";
import Favorites from "./pages/client/Favorites";
import Checkout from "./pages/client/Checkout";

import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

/* =========================================================
   Loading Screen
========================================================= */

function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

/* =========================================================
   Admin Route
========================================================= */

function AdminRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  const {
    data: isAdmin,
    isLoading: roleLoading,
  } = useQuery({
    queryKey: ["user-admin-role", user?.id],

    queryFn: async () => {
      if (!user) {
        return false;
      }

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

    // Role does not need to be requested repeatedly
    staleTime: 5 * 60 * 1000,

    // Don't retry endlessly if the request fails
    retry: 1,
  });

  if (loading || roleLoading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/* =========================================================
   Protected Route
========================================================= */

function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

/* =========================================================
   Auth Route
========================================================= */

function AuthRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoading />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

/* =========================================================
   App
========================================================= */

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <I18nProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />

            <BrowserRouter>
              <Routes>

                {/* ==================== AUTH ==================== */}

            <Route
  path="/auth"
  element={
    <AuthRoute>
      <ClientLayout>
        <Auth />
      </ClientLayout>
    </AuthRoute>
  }
/>
<Route
  path="/register"
  element={
    <AuthRoute>
      <ClientLayout>
        <Register />
      </ClientLayout>
    </AuthRoute>
  }
/>

                {/* ==================== ADMIN ==================== */}

                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <DashboardLayout>
                        <Dashboard />
                      </DashboardLayout>
                    </AdminRoute>
                  }
                />

                <Route
                  path="/admin/products"
                  element={
                    <AdminRoute>
                      <DashboardLayout>
                        <Products />
                      </DashboardLayout>
                    </AdminRoute>
                  }
                />

                <Route
                  path="/admin/orders"
                  element={
                    <AdminRoute>
                      <DashboardLayout>
                        <Orders />
                      </DashboardLayout>
                    </AdminRoute>
                  }
                />

                <Route
                  path="/admin/customers"
                  element={
                    <AdminRoute>
                      <DashboardLayout>
                        <Customers />
                      </DashboardLayout>
                    </AdminRoute>
                  }
                />

                <Route
                  path="/admin/categories"
                  element={
                    <AdminRoute>
                      <DashboardLayout>
                        <Categories />
                      </DashboardLayout>
                    </AdminRoute>
                  }
                />

                <Route
                  path="/admin/analytics"
                  element={
                    <AdminRoute>
                      <DashboardLayout>
                        <Analytics />
                      </DashboardLayout>
                    </AdminRoute>
                  }
                />

                <Route
                  path="/admin/discounts"
                  element={
                    <AdminRoute>
                      <DashboardLayout>
                        <Discounts />
                      </DashboardLayout>
                    </AdminRoute>
                  }
                />

                <Route
                  path="/admin/suppliers"
                  element={
                    <AdminRoute>
                      <DashboardLayout>
                        <Suppliers />
                      </DashboardLayout>
                    </AdminRoute>
                  }
                />

                {/* ==================== CLIENT ==================== */}

                <Route
                  path="/"
                  element={
                    <ClientLayout>
                      <Home />
                    </ClientLayout>
                  }
                />

                <Route
                  path="/shop"
                  element={
                    <ClientLayout>
                      <Shop />
                    </ClientLayout>
                  }
                />

                <Route
                  path="/product/:id"
                  element={
                    <ClientLayout>
                      <ProductDetail />
                    </ClientLayout>
                  }
                />

                <Route
                  path="/cart"
                  element={
                    <ClientLayout>
                      <Cart />
                    </ClientLayout>
                  }
                />

                <Route
                  path="/checkout"
                  element={
                    <ClientLayout>
                      <Checkout />
                    </ClientLayout>
                  }
                />

                {/* ==================== PROTECTED CLIENT ==================== */}

                <Route
                  path="/favorites"
                  element={
                    <ProtectedRoute>
                      <ClientLayout>
                        <Favorites />
                      </ClientLayout>
                    </ProtectedRoute>
                  }
                />

                {/* ==================== 404 ==================== */}

                <Route
                  path="*"
                  element={
                    <ClientLayout>
                      <NotFound />
                    </ClientLayout>
                  }
                />

              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </I18nProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
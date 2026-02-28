import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClientLayout } from "@/components/layout/ClientLayout";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Customers from "./pages/Customers";
import Categories from "./pages/Categories";
import Analytics from "./pages/Analytics";
import Discounts from "./pages/Discounts";
import Reviews from "./pages/Reviews";
import SettingsPage from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Home from "./pages/client/Home";
import Shop from "./pages/client/Shop";
import ProductDetail from "./pages/client/ProductDetail";
import Cart from "./pages/client/Cart";
import Favorites from "./pages/client/Favorites";
import Checkout from "./pages/client/Checkout";

const queryClient = new QueryClient();

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthRoute />} />

            {/* Admin routes */}
            <Route path="/admin" element={
              <AdminRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </AdminRoute>
            } />
            <Route path="/admin/products" element={<AdminRoute><DashboardLayout><Products /></DashboardLayout></AdminRoute>} />
            <Route path="/admin/orders" element={<AdminRoute><DashboardLayout><Orders /></DashboardLayout></AdminRoute>} />
            <Route path="/admin/customers" element={<AdminRoute><DashboardLayout><Customers /></DashboardLayout></AdminRoute>} />
            <Route path="/admin/categories" element={<AdminRoute><DashboardLayout><Categories /></DashboardLayout></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><DashboardLayout><Analytics /></DashboardLayout></AdminRoute>} />
            <Route path="/admin/discounts" element={<AdminRoute><DashboardLayout><Discounts /></DashboardLayout></AdminRoute>} />
            <Route path="/admin/reviews" element={<AdminRoute><DashboardLayout><Reviews /></DashboardLayout></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><DashboardLayout><SettingsPage /></DashboardLayout></AdminRoute>} />

            {/* Client routes */}
            <Route path="/" element={<ClientLayout><Home /></ClientLayout>} />
            <Route path="/shop" element={<ClientLayout><Shop /></ClientLayout>} />
            <Route path="/product/:id" element={<ClientLayout><ProductDetail /></ClientLayout>} />
            <Route path="/cart" element={<ClientLayout><Cart /></ClientLayout>} />
            <Route path="/favorites" element={<ClientLayout><Favorites /></ClientLayout>} />
            <Route path="/checkout" element={<ClientLayout><Checkout /></ClientLayout>} />

            <Route path="*" element={<ClientLayout><NotFound /></ClientLayout>} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

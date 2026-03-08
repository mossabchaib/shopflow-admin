import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, Package, MapPin, User, Save, Plus, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function Account() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  // Address form
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [addrForm, setAddrForm] = useState({
    full_name: "", phone: "", street: "", city: "", state: "", postal_code: "", country: "",
  });

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  async function fetchAll() {
    setLoading(true);
    const [profileRes, ordersRes, addrRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("orders").select("*, order_items(*, products(name, product_images(image_url, is_primary)))").eq("customer_id", user!.id).order("created_at", { ascending: false }),
      supabase.from("addresses").select("*").eq("user_id", user!.id).order("is_default", { ascending: false }),
    ]);

    setProfile(profileRes.data);
    setName(profileRes.data?.name || "");
    setPhone(profileRes.data?.phone || "");
    setOrders(ordersRes.data || []);
    setAddresses(addrRes.data || []);
    setLoading(false);
  }

  async function saveProfile() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ name, phone })
      .eq("user_id", user.id);
    if (error) toast.error("Failed to save");
    else toast.success(t("account.saved"));
    setSaving(false);
  }

  async function addAddress() {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("addresses").insert({
      ...addrForm,
      user_id: user.id,
      is_default: addresses.length === 0,
    });
    if (error) toast.error("Failed to add address");
    else {
      toast.success(t("account.addressAdded"));
      setShowAddressForm(false);
      setAddrForm({ full_name: "", phone: "", street: "", city: "", state: "", postal_code: "", country: "" });
      fetchAll();
    }
    setSaving(false);
  }

  async function deleteAddress(id: string) {
    const { error } = await supabase.from("addresses").delete().eq("id", id);
    if (!error) { toast.success(t("account.addressDeleted")); fetchAll(); }
  }

  async function setDefaultAddress(id: string) {
    if (!user) return;
    await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
    await supabase.from("addresses").update({ is_default: true }).eq("id", id);
    fetchAll();
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
              {(name || user?.email)?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{name || user?.email}</h1>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Tabs defaultValue="orders" className="space-y-6">
          <TabsList className="bg-muted/60">
            <TabsTrigger value="orders" className="gap-2"><Package className="h-4 w-4" />{t("account.orders")}</TabsTrigger>
            <TabsTrigger value="addresses" className="gap-2"><MapPin className="h-4 w-4" />{t("account.addresses")}</TabsTrigger>
            <TabsTrigger value="profile" className="gap-2"><User className="h-4 w-4" />{t("account.profile")}</TabsTrigger>
          </TabsList>

          {/* ── Orders Tab ── */}
          <TabsContent value="orders">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">{t("account.noOrders")}</p>
                  <Button className="mt-4" onClick={() => window.location.href = "/shop"}>{t("account.shopNow")}</Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <Card key={order.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-sm font-mono">#{order.id.slice(0, 8)}</CardTitle>
                          <Badge variant="secondary" className={statusColors[order.status] || ""}>
                            {order.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {(order.order_items || []).map((item: any) => {
                          const img = item.products?.product_images?.find((i: any) => i.is_primary)?.image_url
                            || item.products?.product_images?.[0]?.image_url;
                          return (
                            <div key={item.id} className="flex items-center gap-3">
                              {img ? (
                                <img src={img} alt="" className="h-12 w-12 rounded-lg object-cover" />
                              ) : (
                                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                  <Package className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{item.products?.name || "Product"}</p>
                                <p className="text-xs text-muted-foreground">x{item.quantity}</p>
                              </div>
                              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                                ${Number(item.total_price).toFixed(2)}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t("account.total")}</span>
                        <span className="font-bold text-foreground">${Number(order.total).toFixed(2)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Addresses Tab ── */}
          <TabsContent value="addresses">
            <div className="space-y-4">
              {addresses.map((addr) => (
                <Card key={addr.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">{addr.full_name}</p>
                          {addr.is_default && <Badge variant="secondary" className="text-xs">{t("account.default")}</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground">{addr.phone}</p>
                        <p className="text-sm text-muted-foreground">
                          {[addr.street, addr.city, addr.state, addr.postal_code, addr.country].filter(Boolean).join(", ")}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {!addr.is_default && (
                          <Button size="sm" variant="outline" onClick={() => setDefaultAddress(addr.id)}>
                            <Star className="h-3 w-3 mr-1" />{t("account.setDefault")}
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => deleteAddress(addr.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {showAddressForm ? (
                <Card>
                  <CardHeader><CardTitle className="text-base">{t("account.newAddress")}</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div><Label>{t("checkout.fullName")}</Label><Input value={addrForm.full_name} onChange={e => setAddrForm(p => ({ ...p, full_name: e.target.value }))} /></div>
                      <div><Label>{t("checkout.phone")}</Label><Input value={addrForm.phone} onChange={e => setAddrForm(p => ({ ...p, phone: e.target.value }))} /></div>
                      <div className="sm:col-span-2"><Label>{t("checkout.street")}</Label><Input value={addrForm.street} onChange={e => setAddrForm(p => ({ ...p, street: e.target.value }))} /></div>
                      <div><Label>{t("checkout.city")}</Label><Input value={addrForm.city} onChange={e => setAddrForm(p => ({ ...p, city: e.target.value }))} /></div>
                      <div><Label>{t("checkout.state")}</Label><Input value={addrForm.state} onChange={e => setAddrForm(p => ({ ...p, state: e.target.value }))} /></div>
                      <div><Label>{t("checkout.postalCode")}</Label><Input value={addrForm.postal_code} onChange={e => setAddrForm(p => ({ ...p, postal_code: e.target.value }))} /></div>
                      <div><Label>{t("checkout.country")}</Label><Input value={addrForm.country} onChange={e => setAddrForm(p => ({ ...p, country: e.target.value }))} /></div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button onClick={addAddress} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}{t("account.save")}</Button>
                      <Button variant="outline" onClick={() => setShowAddressForm(false)}>{t("account.cancel")}</Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Button variant="outline" onClick={() => setShowAddressForm(true)} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />{t("account.addAddress")}
                </Button>
              )}
            </div>
          </TabsContent>

          {/* ── Profile Tab ── */}
          <TabsContent value="profile">
            <Card>
              <CardHeader><CardTitle className="text-base">{t("account.personalInfo")}</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg">
                  <div className="sm:col-span-2">
                    <Label>{t("account.email")}</Label>
                    <Input value={user?.email || ""} disabled className="bg-muted/40" />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t("account.name")}</Label>
                    <Input value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div className="sm:col-span-2">
                    <Label>{t("checkout.phone")}</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>
                </div>
                <Button className="mt-4" onClick={saveProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {t("account.save")}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
}

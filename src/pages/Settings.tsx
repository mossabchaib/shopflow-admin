import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

const SettingsPage = () => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const { toast } = useToast();

  const fetchSettings = async () => {
    const { data, error } = await supabase.from("settings").select("*").limit(1).single();
    if (error && error.code !== "PGRST116") { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    setSettings(data || { store_name: "My Store", currency: "USD", timezone: "UTC", shipping_price: 0, free_shipping_threshold: 0, payment_methods: {}, logo_url: "" });
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const saveSettings = async () => {
    setSaving(true);
    const { error } = settings.id
      ? await supabase.from("settings").update(settings).eq("id", settings.id)
      : await supabase.from("settings").insert(settings);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Settings saved" }); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (passwords.new !== passwords.confirm) { toast({ title: "Error", description: "Passwords don't match", variant: "destructive" }); return; }
    if (passwords.new.length < 6) { toast({ title: "Error", description: "Password must be at least 6 characters", variant: "destructive" }); return; }
    const { error } = await supabase.auth.updateUser({ password: passwords.new });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Password updated" });
    setPasswords({ current: "", new: "", confirm: "" });
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your store configuration</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="admin">Admin</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="dashboard-card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Store Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div><Label>Store Name</Label><Input value={settings?.store_name || ""} onChange={e => setSettings({ ...settings, store_name: e.target.value })} className="mt-1.5" /></div>
              <div>
                <Label>Currency</Label>
                <Select value={settings?.currency || "USD"} onValueChange={v => setSettings({ ...settings, currency: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="USD">USD ($)</SelectItem><SelectItem value="EUR">EUR (€)</SelectItem><SelectItem value="GBP">GBP (£)</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timezone</Label>
                <Select value={settings?.timezone || "UTC"} onValueChange={v => setSettings({ ...settings, timezone: v })}>
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="UTC">UTC</SelectItem><SelectItem value="EST">Eastern Time</SelectItem><SelectItem value="PST">Pacific Time</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Logo URL</Label><Input value={settings?.logo_url || ""} onChange={e => setSettings({ ...settings, logo_url: e.target.value })} placeholder="https://..." className="mt-1.5" /></div>
            </div>
            <Button onClick={saveSettings} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="dashboard-card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Payment Methods</h2>
            <div className="space-y-4">
              {["stripe", "paypal", "cash_on_delivery"].map((method) => (
                <div key={method} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{method.replace("_", " ")}</p>
                    <p className="text-xs text-muted-foreground">Enable {method.replace("_", " ")} payments</p>
                  </div>
                  <Switch checked={settings?.payment_methods?.[method] || false} onCheckedChange={v => setSettings({ ...settings, payment_methods: { ...settings.payment_methods, [method]: v } })} />
                </div>
              ))}
            </div>
            <Button onClick={saveSettings} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6">
          <div className="dashboard-card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Shipping Configuration</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div><Label>Shipping Price ($)</Label><Input type="number" value={settings?.shipping_price || 0} onChange={e => setSettings({ ...settings, shipping_price: parseFloat(e.target.value) })} className="mt-1.5" /></div>
              <div><Label>Free Shipping Threshold ($)</Label><Input type="number" value={settings?.free_shipping_threshold || 0} onChange={e => setSettings({ ...settings, free_shipping_threshold: parseFloat(e.target.value) })} className="mt-1.5" /></div>
            </div>
            <Button onClick={saveSettings} disabled={saving}>{saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <div className="dashboard-card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
            <div className="max-w-md space-y-4">
              <div><Label>New Password</Label><Input type="password" value={passwords.new} onChange={e => setPasswords({ ...passwords, new: e.target.value })} className="mt-1.5" /></div>
              <div><Label>Confirm Password</Label><Input type="password" value={passwords.confirm} onChange={e => setPasswords({ ...passwords, confirm: e.target.value })} className="mt-1.5" /></div>
            </div>
            <Button onClick={changePassword}>Update Password</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

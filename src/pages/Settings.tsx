import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

const SettingsPage = () => {
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
              <div><Label>Store Name</Label><Input defaultValue="My Store" className="mt-1.5" /></div>
              <div>
                <Label>Currency</Label>
                <Select defaultValue="USD">
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="GBP">GBP (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timezone</Label>
                <Select defaultValue="UTC">
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="EST">Eastern Time</SelectItem>
                    <SelectItem value="PST">Pacific Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Logo URL</Label><Input placeholder="https://..." className="mt-1.5" /></div>
            </div>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <div className="dashboard-card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Payment Methods</h2>
            <div className="space-y-4">
              {["Stripe", "PayPal", "Cash on Delivery"].map((method) => (
                <div key={method} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">{method}</p>
                    <p className="text-xs text-muted-foreground">Enable {method.toLowerCase()} payments</p>
                  </div>
                  <Switch defaultChecked={method !== "Cash on Delivery"} />
                </div>
              ))}
            </div>
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">API Keys</h3>
              <div><Label>Stripe Public Key</Label><Input placeholder="pk_..." className="mt-1.5 font-mono text-sm" /></div>
              <div><Label>Stripe Secret Key</Label><Input type="password" placeholder="sk_..." className="mt-1.5 font-mono text-sm" /></div>
            </div>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-6">
          <div className="dashboard-card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Shipping Configuration</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div><Label>Shipping Price ($)</Label><Input type="number" defaultValue="5.00" className="mt-1.5" /></div>
              <div><Label>Free Shipping Threshold ($)</Label><Input type="number" defaultValue="50.00" className="mt-1.5" /></div>
            </div>
            <Button>Save Changes</Button>
          </div>
        </TabsContent>

        <TabsContent value="admin" className="space-y-6">
          <div className="dashboard-card p-6 space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Change Password</h2>
            <div className="max-w-md space-y-4">
              <div><Label>Current Password</Label><Input type="password" className="mt-1.5" /></div>
              <div><Label>New Password</Label><Input type="password" className="mt-1.5" /></div>
              <div><Label>Confirm Password</Label><Input type="password" className="mt-1.5" /></div>
            </div>
            <Button>Update Password</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsPage;

import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const coupons = [
  { id: "1", code: "SAVE20", type: "Percentage", value: "20%", expires: "2026-03-15", limit: 100, used: 34, active: true },
  { id: "2", code: "FLAT10", type: "Fixed", value: "$10.00", expires: "2026-04-01", limit: 50, used: 12, active: true },
  { id: "3", code: "SUMMER25", type: "Percentage", value: "25%", expires: "2026-02-20", limit: 200, used: 200, active: false },
  { id: "4", code: "WELCOME5", type: "Fixed", value: "$5.00", expires: "2026-12-31", limit: null, used: 89, active: true },
];

const Discounts = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Discounts & Coupons</h1>
          <p className="text-sm text-muted-foreground mt-1">{coupons.length} coupons</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Coupon</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Coupon</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Code</Label><Input placeholder="COUPON_CODE" className="mt-1.5" /></div>
              <div>
                <Label>Discount Type</Label>
                <Select><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="fixed">Fixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Value</Label><Input type="number" placeholder="0" className="mt-1.5" /></div>
                <div><Label>Usage Limit</Label><Input type="number" placeholder="Unlimited" className="mt-1.5" /></div>
              </div>
              <div><Label>Expiration</Label><Input type="date" className="mt-1.5" /></div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch defaultChecked />
              </div>
              <Button className="w-full">Save Coupon</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="table-header text-left p-4">Code</th>
              <th className="table-header text-left p-4">Type</th>
              <th className="table-header text-left p-4">Value</th>
              <th className="table-header text-left p-4">Expires</th>
              <th className="table-header text-left p-4">Usage</th>
              <th className="table-header text-left p-4">Status</th>
              <th className="table-header text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4 text-sm font-mono font-medium text-primary">{c.code}</td>
                <td className="p-4 text-sm text-muted-foreground">{c.type}</td>
                <td className="p-4 text-sm font-medium text-foreground">{c.value}</td>
                <td className="p-4 text-sm text-muted-foreground">{c.expires}</td>
                <td className="p-4 text-sm text-foreground">{c.used}{c.limit ? `/${c.limit}` : ""}</td>
                <td className="p-4">
                  <span className={`status-badge ${c.active ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {c.active ? "Active" : "Expired"}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Discounts;

import { useState } from "react";
import { Search, Plus, Edit, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";

const products = [
  { id: "1", name: "Wireless Headphones", category: "Electronics", price: 79.99, stock: 3, status: "active", image: "🎧" },
  { id: "2", name: "Cotton T-Shirt", category: "Clothing", price: 24.99, stock: 150, status: "active", image: "👕" },
  { id: "3", name: "Leather Wallet", category: "Accessories", price: 49.99, stock: 45, status: "draft", image: "👛" },
  { id: "4", name: "Running Shoes", category: "Footwear", price: 119.99, stock: 28, status: "active", image: "👟" },
  { id: "5", name: "Phone Case Pro", category: "Accessories", price: 19.99, stock: 2, status: "active", image: "📱" },
  { id: "6", name: "Bluetooth Speaker", category: "Electronics", price: 59.99, stock: 67, status: "draft", image: "🔊" },
];

const categories = ["All", "Electronics", "Clothing", "Accessories", "Footwear"];

const Products = () => {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || p.category === category;
    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">{products.length} products total</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Name</Label><Input placeholder="Product name" className="mt-1.5" /></div>
              <div><Label>Description</Label><Textarea placeholder="Product description" className="mt-1.5" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Price</Label><Input type="number" placeholder="0.00" className="mt-1.5" /></div>
                <div><Label>Discount Price</Label><Input type="number" placeholder="0.00" className="mt-1.5" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Category</Label>
                  <Select><SelectTrigger className="mt-1.5"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{categories.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Stock</Label><Input type="number" placeholder="0" className="mt-1.5" /></div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Active</Label>
                <Switch defaultChecked />
              </div>
              <Button className="w-full">Save Product</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="table-header text-left p-4">Product</th>
              <th className="table-header text-left p-4">Category</th>
              <th className="table-header text-left p-4">Price</th>
              <th className="table-header text-left p-4">Stock</th>
              <th className="table-header text-left p-4">Status</th>
              <th className="table-header text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((product) => (
              <tr key={product.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg">{product.image}</div>
                    <span className="text-sm font-medium text-foreground">{product.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground">{product.category}</td>
                <td className="p-4 text-sm font-medium text-foreground">${product.price}</td>
                <td className="p-4">
                  <span className={`text-sm font-medium ${product.stock < 10 ? "text-destructive" : "text-foreground"}`}>
                    {product.stock}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`status-badge ${product.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>
                    {product.status === "active" ? "Active" : "Draft"}
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

export default Products;

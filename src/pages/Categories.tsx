import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categoriesList = [
  { id: "1", name: "Electronics", slug: "electronics", products: 42, image: "⚡" },
  { id: "2", name: "Clothing", slug: "clothing", products: 87, image: "👔" },
  { id: "3", name: "Accessories", slug: "accessories", products: 35, image: "💍" },
  { id: "4", name: "Footwear", slug: "footwear", products: 28, image: "👞" },
  { id: "5", name: "Home & Living", slug: "home-living", products: 56, image: "🏠" },
];

const Categories = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">{categoriesList.length} categories</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Category</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Category</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Name</Label><Input placeholder="Category name" className="mt-1.5" /></div>
              <div><Label>Slug</Label><Input placeholder="category-slug" className="mt-1.5" /></div>
              <Button className="w-full">Save Category</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="table-header text-left p-4">Category</th>
              <th className="table-header text-left p-4">Slug</th>
              <th className="table-header text-left p-4">Products</th>
              <th className="table-header text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categoriesList.map((cat) => (
              <tr key={cat.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-lg">{cat.image}</div>
                    <span className="text-sm font-medium text-foreground">{cat.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground font-mono">{cat.slug}</td>
                <td className="p-4 text-sm text-foreground">{cat.products}</td>
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

export default Categories;

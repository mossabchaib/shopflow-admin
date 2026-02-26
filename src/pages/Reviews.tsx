import { Star, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";

const reviews = [
  { id: "1", customer: "John Smith", product: "Wireless Headphones", rating: 5, comment: "Amazing sound quality! Best headphones I've ever owned.", status: "Approved" },
  { id: "2", customer: "Sarah Connor", product: "Cotton T-Shirt", rating: 4, comment: "Great fit and comfortable. Would buy again.", status: "Approved" },
  { id: "3", customer: "Mike Wilson", product: "Running Shoes", rating: 3, comment: "Decent shoes, but the sizing runs a bit small.", status: "Pending" },
  { id: "4", customer: "Emma Davis", product: "Leather Wallet", rating: 5, comment: "Beautiful craftsmanship, love the design.", status: "Pending" },
  { id: "5", customer: "Alex Brown", product: "Phone Case Pro", rating: 2, comment: "Cracked after a week. Not very durable.", status: "Pending" },
];

const statusColors: Record<string, string> = {
  Approved: "bg-success/10 text-success",
  Pending: "bg-warning/10 text-warning",
  Rejected: "bg-destructive/10 text-destructive",
};

const Reviews = () => {
  const [filter, setFilter] = useState("All");
  const filtered = reviews.filter(r => filter === "All" || r.status === filter);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Reviews</h1>
          <p className="text-sm text-muted-foreground mt-1">{reviews.length} reviews</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Approved">Approved</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="table-header text-left p-4">Customer</th>
              <th className="table-header text-left p-4">Product</th>
              <th className="table-header text-left p-4">Rating</th>
              <th className="table-header text-left p-4">Review</th>
              <th className="table-header text-left p-4">Status</th>
              <th className="table-header text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4 text-sm font-medium text-foreground">{r.customer}</td>
                <td className="p-4 text-sm text-muted-foreground">{r.product}</td>
                <td className="p-4">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < r.rating ? "fill-warning text-warning" : "text-border"}`} />
                    ))}
                  </div>
                </td>
                <td className="p-4 text-sm text-foreground max-w-[250px] truncate">{r.comment}</td>
                <td className="p-4"><span className={`status-badge ${statusColors[r.status]}`}>{r.status}</span></td>
                <td className="p-4">
                  {r.status === "Pending" && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-success"><Check className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive"><X className="h-4 w-4" /></Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reviews;

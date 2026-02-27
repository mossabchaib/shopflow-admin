import { useState, useEffect } from "react";
import { Star, Check, X, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  status: string;
  created_at: string;
  products?: { name: string } | null;
  profiles?: { name: string; email: string } | null;
}

const statusColors: Record<string, string> = {
  approved: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  rejected: "bg-destructive/10 text-destructive",
};

const Reviews = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Review | null>(null);
  const { toast } = useToast();

  const fetchReviews = async () => {
    const { data, error } = await supabase
      .from("reviews")
      .select("*, products(name), profiles:customer_id(name, email)")
      .order("created_at", { ascending: false });
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    setReviews((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const filtered = reviews.filter(r => filter === "All" || r.status === filter.toLowerCase());

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("reviews").update({ status: status as any }).eq("id", id);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: `Review ${status}` });
    fetchReviews();
  };

  const openView = (r: Review) => { setSelected(r); setViewOpen(true); };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "fill-warning text-warning" : "text-border"}`} />
      ))}
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

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
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
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
              <th className="table-header text-left p-4">Comment</th>
              <th className="table-header text-left p-4">Status</th>
              <th className="table-header text-left p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4 text-sm font-medium text-foreground">{(r.profiles as any)?.name || "—"}</td>
                <td className="p-4 text-sm text-muted-foreground">{r.products?.name || "—"}</td>
                <td className="p-4"><StarRating rating={r.rating} /></td>
                <td className="p-4 text-sm text-foreground max-w-[250px] truncate">{r.comment || "—"}</td>
                <td className="p-4"><span className={`status-badge ${statusColors[r.status] || ""}`}>{r.status}</span></td>
                <td className="p-4">
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => openView(r)}><Eye className="h-4 w-4" /></Button>
                    {r.status === "pending" && (
                      <>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-success" onClick={() => updateStatus(r.id, "approved")}><Check className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => updateStatus(r.id, "rejected")}><X className="h-4 w-4" /></Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No reviews found</td></tr>}
          </tbody>
        </table>
      </div>

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Review Details</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Customer</span><p className="font-medium">{(selected.profiles as any)?.name || "—"}</p></div>
                <div><span className="text-sm text-muted-foreground">Product</span><p>{selected.products?.name || "—"}</p></div>
              </div>
              <div><span className="text-sm text-muted-foreground">Rating</span><div className="mt-1"><StarRating rating={selected.rating} /></div></div>
              <div><span className="text-sm text-muted-foreground">Comment</span><p className="text-sm mt-1">{selected.comment || "No comment"}</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div><span className="text-sm text-muted-foreground">Status</span><p><span className={`status-badge ${statusColors[selected.status] || ""}`}>{selected.status}</span></p></div>
                <div><span className="text-sm text-muted-foreground">Date</span><p>{new Date(selected.created_at).toLocaleDateString()}</p></div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Reviews;

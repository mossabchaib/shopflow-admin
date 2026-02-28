import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const Favorites = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFavs = async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from("favorites")
      .select("*, products(id, name, price, discount_price, product_images(image_url, is_primary))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setFavorites(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchFavs(); }, [user]);

  const remove = async (id: string) => {
    await supabase.from("favorites").delete().eq("id", id);
    setFavorites(favorites.filter(f => f.id !== id));
  };

  const getImage = (p: any) => {
    const primary = p?.product_images?.find((i: any) => i.is_primary);
    return primary?.image_url || p?.product_images?.[0]?.image_url || "/placeholder.svg";
  };

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-foreground mb-2">Sign in to view favorites</h2>
      <Button onClick={() => navigate("/auth")}>Sign In</Button>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-foreground mb-8">My Favorites</h1>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">No favorites yet</p>
          <Button asChild><Link to="/shop">Browse Products</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {favorites.map((fav, i) => (
            <motion.div key={fav.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }} className="relative group">
              <Link to={`/product/${fav.products?.id}`} className="block">
                <div className="aspect-square rounded-xl overflow-hidden bg-muted mb-3">
                  <img src={getImage(fav.products)} alt={fav.products?.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <h3 className="text-sm font-medium text-foreground truncate">{fav.products?.name}</h3>
                <span className="text-sm font-bold text-primary">${Number(fav.products?.discount_price || fav.products?.price || 0).toFixed(2)}</span>
              </Link>
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 bg-card/80 backdrop-blur-sm text-destructive" onClick={() => remove(fav.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favorites;

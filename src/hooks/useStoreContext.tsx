import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface StoreData {
  id: string;
  store_name: string;
  slug: string;
  logo_url: string | null;
  background_url: string | null;
  description: string | null;
  owner_id: string;
  status: string;
}

interface StoreContextType {
  store: StoreData | null;
  loading: boolean;
  /** Base path like "/store/my-slug" */
  basePath: string;
}

const StoreContext = createContext<StoreContextType>({ store: null, loading: true, basePath: "" });

export function StoreProvider({ children }: { children: ReactNode }) {
  const { slug } = useParams<{ slug: string }>();
  const [store, setStore] = useState<StoreData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) { setLoading(false); return; }
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("slug", slug)
        .eq("status", "approved")
        .maybeSingle();
      setStore(data);
      setLoading(false);
    };
    fetch();
  }, [slug]);

  return (
    <StoreContext.Provider value={{ store, loading, basePath: `/store/${slug}` }}>
      {children}
    </StoreContext.Provider>
  );
}

export const useStoreContext = () => useContext(StoreContext);

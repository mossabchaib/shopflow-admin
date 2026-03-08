import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export function useUserRole() {
  const { user } = useAuth();

  const { data: role, isLoading } = useQuery({
    queryKey: ["user-role", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      return data?.role || "customer";
    },
    enabled: !!user,
  });

  return { role: role as string | null, isLoading };
}

export function useUserStore() {
  const { user } = useAuth();

  const { data: store, isLoading, refetch } = useQuery({
    queryKey: ["user-store", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("stores")
        .select("*")
        .eq("owner_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  return { store, isLoading, refetch };
}

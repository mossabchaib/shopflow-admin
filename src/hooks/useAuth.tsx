import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    console.log("AUTH PROVIDER: MOUNT");

    const {
      data: { subscription },
    } =supabase.auth.onAuthStateChange((event, nextSession) => {
  if (!mounted) return;

  console.log("AUTH EVENT:", event);

  if (nextSession) {
    console.log("TOKEN INFO:", {
      expiresAt: nextSession.expires_at,
      expiresIn: nextSession.expires_at
        ? nextSession.expires_at - Math.floor(Date.now() / 1000)
        : null,
    });
  }

  setSession(nextSession);
  setLoading(false);
});

    /*
     * Get the current session only once.
     *
     * This is used to initialize the UI if the auth listener
     * has not received INITIAL_SESSION yet.
     */
    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        console.error("AUTH INITIALIZATION ERROR:", error);
        setSession(null);
      } else {
        setSession(data.session);
      }

      setLoading(false);
    });

    return () => {
      mounted = false;

      console.log("AUTH PROVIDER: UNMOUNT");

      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    console.log("AUTH: SIGN OUT REQUEST");

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("AUTH SIGN OUT ERROR:", error);
      throw error;
    }

    console.log("AUTH: SIGN OUT SUCCESS");
  };

  const user = session?.user ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
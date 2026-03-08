import { ReactNode } from "react";
import { StoreProvider, useStoreContext } from "@/hooks/useStoreContext";
import { StoreNavbar } from "@/components/layout/StoreNavbar";
import { StoreFooter } from "@/components/layout/StoreFooter";
import { Loader2, Store as StoreIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useI18n } from "@/lib/i18n";

function StoreLayoutInner({ children }: { children: ReactNode }) {
  const { store, loading } = useStoreContext();
  const { t } = useI18n();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  if (!store) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <StoreIcon className="h-12 w-12 text-muted-foreground" />
      <p className="text-muted-foreground text-lg">{t("store.notFound")}</p>
      <Button asChild><Link to="/">{t("nav.home")}</Link></Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StoreNavbar />
      <main className="flex-1">{children}</main>
      <StoreFooter />
    </div>
  );
}

export function StoreLayout({ children }: { children: ReactNode }) {
  return (
    <StoreProvider>
      <StoreLayoutInner>{children}</StoreLayoutInner>
    </StoreProvider>
  );
}

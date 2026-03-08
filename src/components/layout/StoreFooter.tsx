import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { useStoreContext } from "@/hooks/useStoreContext";

export function StoreFooter() {
  const { t } = useI18n();
  const { store, basePath } = useStoreContext();
  const year = new Date().getFullYear();

  return (
    <footer className="bg-foreground text-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              {store?.logo_url ? (
                <img src={store.logo_url} alt={store.store_name} className="h-9 w-9 rounded-lg object-cover" />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">{store?.store_name?.charAt(0)}</span>
                </div>
              )}
              <span className="font-bold text-lg">{store?.store_name}</span>
            </div>
            {store?.description && (
              <p className="text-sm opacity-70 leading-relaxed max-w-xs">{store.description}</p>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 opacity-80">{t("footer.quickLinks")}</h4>
            <ul className="space-y-2.5">
              {[
                { to: basePath, label: t("nav.home") },
                { to: `${basePath}/shop`, label: t("nav.shop") },
                { to: "/cart", label: t("nav.cart") },
              ].map(link => (
                <li key={link.to}>
                  <Link to={link.to} className="text-sm opacity-70 hover:opacity-100 transition-opacity">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider mb-4 opacity-80">{t("footer.followUs")}</h4>
            <div className="flex items-center gap-3">
              {[Facebook, Twitter, Instagram].map((Icon, i) => (
                <a key={i} href="#" className="h-10 w-10 rounded-lg bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-background/10 mt-10 pt-6 text-center">
          <p className="text-xs opacity-50">© {year} {store?.store_name}. {t("footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}

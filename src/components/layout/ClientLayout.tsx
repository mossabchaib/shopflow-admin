import { ReactNode } from "react";
import { ClientNavbar } from "@/components/layout/ClientNavbar";
import { Footer } from "@/components/layout/Footer";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClientNavbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

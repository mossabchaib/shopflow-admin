import { ReactNode } from "react";
import { ClientNavbar } from "@/components/layout/ClientNavbar";

export function ClientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <ClientNavbar />
      <main>{children}</main>
    </div>
  );
}

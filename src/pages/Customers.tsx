import { Search, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const customers = [
  { id: "1", name: "John Smith", email: "john@example.com", orders: 12, spent: "$1,245.00", date: "2025-11-15", avatar: "JS" },
  { id: "2", name: "Sarah Connor", email: "sarah@example.com", orders: 8, spent: "$892.50", date: "2025-12-03", avatar: "SC" },
  { id: "3", name: "Mike Wilson", email: "mike@example.com", orders: 23, spent: "$3,450.00", date: "2025-08-22", avatar: "MW" },
  { id: "4", name: "Emma Davis", email: "emma@example.com", orders: 5, spent: "$412.80", date: "2026-01-10", avatar: "ED" },
  { id: "5", name: "Alex Brown", email: "alex@example.com", orders: 17, spent: "$2,180.40", date: "2025-09-18", avatar: "AB" },
];

const Customers = () => {
  const [search, setSearch] = useState("");
  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) || c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Customers</h1>
        <p className="text-sm text-muted-foreground mt-1">{customers.length} customers total</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="dashboard-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="table-header text-left p-4">Customer</th>
              <th className="table-header text-left p-4">Email</th>
              <th className="table-header text-left p-4">Orders</th>
              <th className="table-header text-left p-4">Total Spent</th>
              <th className="table-header text-left p-4">Registered</th>
              <th className="table-header text-left p-4">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">{c.avatar}</div>
                    <span className="text-sm font-medium text-foreground">{c.name}</span>
                  </div>
                </td>
                <td className="p-4 text-sm text-muted-foreground">{c.email}</td>
                <td className="p-4 text-sm text-foreground">{c.orders}</td>
                <td className="p-4 text-sm font-medium text-foreground">{c.spent}</td>
                <td className="p-4 text-sm text-muted-foreground">{c.date}</td>
                <td className="p-4">
                  <Button variant="ghost" size="sm" className="text-muted-foreground"><Eye className="h-4 w-4 mr-1" />View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Customers;

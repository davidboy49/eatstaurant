"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { collection, query, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(query(collection(db, "orders")), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: "100vh" }}>
        <p className="text-secondary">Loading Eatstaurant...</p>
      </div>
    );
  }

  // Calculate stats
  const today = new Date().toISOString().split('T')[0];

  const todaysOrders = orders.filter(o => o.createdAt && o.createdAt.startsWith(today));
  const todaysSales = todaysOrders.reduce((acc, o) => acc + (o.total || 0), 0);
  const activeOrders = orders.filter(o => ["Received", "Preparing", "Ready"].includes(o.status));

  return (
    <div className="flex" style={{ minHeight: "100vh" }}>
      <Sidebar />

      {/* Main Content */}
      <main style={{ flex: 1, padding: "var(--spacing-4) var(--spacing-6)", overflowY: "auto" }}>
        <header style={{ marginBottom: "var(--spacing-8)" }}>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-secondary">Welcome back to your restaurant portal.</p>
        </header>

        <div className="flex flex-col gap-6">
          {/* Summary Cards */}
          <div className="flex gap-4">
            <SummaryCard title="Today's Sales" value={`$${todaysSales.toFixed(2)}`} trend={`${todaysOrders.length} orders`} color="var(--color-success)" />
            <SummaryCard title="Active Orders" value={activeOrders.length.toString()} trend="In Kitchen" color="var(--color-primary)" />
            <SummaryCard title="Total Orders (All Time)" value={orders.length.toString()} trend="-" color="var(--color-warning)" />
          </div>

          <div className="glass-panel text-sm" style={{ padding: "var(--spacing-6)", flex: 1 }}>
            <h2 className="text-lg font-semibold" style={{ marginBottom: "var(--spacing-4)" }}>Recent Activity</h2>
            {orders.length === 0 ? (
              <div className="flex items-center justify-center p-8 text-secondary" style={{ padding: "4rem" }}>
                No recent orders to display.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 10).map(o => (
                  <div key={o.id} className="flex justify-between border-b pb-2" style={{ borderColor: 'var(--color-icon-bg)' }}>
                    <span>Table {o.tableNumber} <span className="text-secondary">({o.items?.length || 0} items)</span></span>
                    <span className="font-bold text-primary-color">${Number(o.total || 0).toFixed(2)}</span>
                    <span className="text-secondary">{o.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ title, value, trend, color }: { title: string, value: string, trend: string, color: string }) {
  return (
    <div className="glass-panel" style={{ padding: "var(--spacing-5)", flex: 1 }}>
      <p className="text-sm text-secondary" style={{ marginBottom: "var(--spacing-2)" }}>{title}</p>
      <div className="flex items-end justify-between">
        <h2 className="text-2xl font-bold">{value}</h2>
        <span className="text-sm font-medium" style={{ color }}>{trend}</span>
      </div>
    </div>
  );
}

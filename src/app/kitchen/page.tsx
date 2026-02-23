"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, where, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Sidebar from "@/components/Sidebar";
import { Clock, CheckCircle2, ChefHat, Play } from "lucide-react";

interface KitchenOrder {
    id: string;
    orderNumber?: string;
    tableNumber: string;
    status: "Received" | "Preparing" | "Ready" | "Served";
    createdAt: string;
    updatedAt?: string;
    items: Array<{ name: string; quantity: number; notes?: string }>;
}

export default function KDSPage() {
    const [orders, setOrders] = useState<KitchenOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [now, setNow] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!db) return;

        const q = query(
            collection(db, "orders"),
            where("status", "in", ["Received", "Preparing", "Ready"]),
            orderBy("createdAt", "asc")
        );

        const unsub = onSnapshot(
            q,
            (snapshot) => {
                setOrders(snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<KitchenOrder, "id">) })));
                setLoading(false);
            },
            (error) => {
                console.error("Failed to load kitchen queue:", error);
                setLoading(false);
            }
        );

        return () => unsub();
    }, []);

    const updateOrderStatus = async (orderId: string, currentStatus: KitchenOrder["status"]) => {
        let nextStatus: KitchenOrder["status"] = "Served";
        if (currentStatus === "Received") nextStatus = "Preparing";
        else if (currentStatus === "Preparing") nextStatus = "Ready";
        else if (currentStatus === "Ready") nextStatus = "Served";

        if (!db) return;
        await updateDoc(doc(db, "orders", orderId), {
            status: nextStatus,
            updatedAt: new Date().toISOString()
        });
    };

    const getTimeElapsed = (isoString: string, currentTimeMs: number) => {
        const created = new Date(isoString).getTime();
        if (Number.isNaN(created)) return 0;
        return Math.max(0, Math.floor((currentTimeMs - created) / 60000));
    };

    const sortByAge = (list: KitchenOrder[]) =>
        [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    const receivedOrders = sortByAge(orders.filter((o) => o.status === "Received"));
    const preparingOrders = sortByAge(orders.filter((o) => o.status === "Preparing"));
    const readyOrders = sortByAge(orders.filter((o) => o.status === "Ready"));

    const renderColumn = (title: string, list: KitchenOrder[], color: string) => (
        <div className="flex flex-col gap-4" style={{ minWidth: "320px", width: "320px" }}>
            <h3 className="font-bold border-b pb-2 flex justify-between" style={{ borderColor: "var(--color-overlay)" }}>
                <span>{title}</span>
                <span className="text-secondary px-2 rounded-full text-xs" style={{ background: "var(--color-overlay)", padding: "2px 8px" }}>
                    {list.length}
                </span>
            </h3>
            {list.length === 0 && (
                <div className="glass-panel text-secondary text-sm" style={{ padding: "var(--spacing-4)" }}>
                    No orders in this state.
                </div>
            )}
            {list.map((order) => (
                <OrderCard
                    key={order.id}
                    order={order}
                    color={color}
                    onAdvance={() => updateOrderStatus(order.id, order.status)}
                    timeElapsed={getTimeElapsed(order.createdAt, now)}
                />
            ))}
        </div>
    );

    return (
        <div className="flex" style={{ height: "100vh", overflow: "hidden" }}>
            <Sidebar />

            <main style={{ flex: 1, padding: "var(--spacing-4) var(--spacing-6)", overflowY: "auto" }}>
                <header className="flex justify-between items-center" style={{ marginBottom: "var(--spacing-6)" }}>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2">
                            <ChefHat /> Kitchen Display System
                        </h1>
                        <p className="text-secondary">Real-time active order queue.</p>
                    </div>
                </header>

                {loading ? (
                    <div className="text-secondary">Loading active kitchen tickets...</div>
                ) : (
                    <div className="flex gap-6" style={{ height: "calc(100% - 100px)", alignItems: "flex-start", overflowX: "auto" }}>
                        {renderColumn("Received", receivedOrders, "var(--color-primary)")}
                        {renderColumn("Preparing", preparingOrders, "var(--color-warning)")}
                        {renderColumn("Ready to Serve", readyOrders, "var(--color-success)")}
                    </div>
                )}
            </main>
        </div>
    );
}

function OrderCard({ order, color, onAdvance, timeElapsed }: { order: KitchenOrder; color: string; onAdvance: () => void; timeElapsed: number }) {
    const isBlinking = timeElapsed > 15;
    return (
        <div
            className="glass-panel"
            style={{
                borderLeft: `4px solid ${color}`,
                padding: "var(--spacing-4)",
                animation: isBlinking ? "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite" : "none"
            }}
        >
            <div className="flex justify-between items-center mb-3">
                <div>
                    <h3 className="font-bold text-lg">Table: {order.tableNumber || "Walk-in"}</h3>
                    <p className="text-xs text-secondary font-mono">{order.orderNumber || order.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-1 text-sm text-secondary font-mono">
                    <Clock size={14} /> {timeElapsed}m
                </div>
            </div>

            <div className="flex flex-col gap-2 mb-4">
                {order.items?.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="flex flex-col border-b pb-2" style={{ borderColor: "var(--color-icon-bg)" }}>
                        <span className="font-medium">
                            <span className="text-primary-color mr-2">{item.quantity}x</span>
                            {item.name}
                        </span>
                        {item.notes && (
                            <p className="text-sm text-secondary block mt-1 w-full bg-black/20 p-1 rounded">Note: {item.notes}</p>
                        )}
                    </div>
                ))}
            </div>

            <button
                onClick={onAdvance}
                className="w-full flex justify-center items-center gap-2 transition-colors"
                style={{
                    padding: "var(--spacing-3)",
                    background: color,
                    color: "var(--color-text-primary)",
                    border: "none",
                    borderRadius: "var(--radius-md)",
                    fontWeight: "bold",
                    cursor: "pointer",
                    opacity: 0.9
                }}
            >
                {order.status === "Received" ? <Play size={16} /> : <CheckCircle2 size={16} />}
                {order.status === "Received"
                    ? "Start Preparing"
                    : order.status === "Preparing"
                      ? "Mark Ready"
                      : "Mark Served"}
            </button>

            {isBlinking && (
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .7; }
          }
        `
                    }}
                />
            )}
        </div>
    );
}

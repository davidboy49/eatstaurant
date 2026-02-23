"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, query, orderBy, where, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Sidebar from "@/components/Sidebar";
import { Clock, CheckCircle2, ChefHat, Play } from "lucide-react";

export default function KDSPage() {
    const [orders, setOrders] = useState<any[]>([]);

    useEffect(() => {
        if (!db) return;
        // Only fetch active orders for the kitchen
        const q = query(
            collection(db, "orders"),
            where("status", "in", ["Received", "Preparing", "Ready"]),
            orderBy("createdAt", "asc")
        );

        const unsub = onSnapshot(q, (snapshot) => {
            setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => unsub();
    }, []);

    const updateOrderStatus = async (orderId: string, currentStatus: string) => {
        let nextStatus = "Completed";
        if (currentStatus === "Received") nextStatus = "Preparing";
        else if (currentStatus === "Preparing") nextStatus = "Ready";
        else if (currentStatus === "Ready") nextStatus = "Served";

        if (!db) return;
        await updateDoc(doc(db, "orders", orderId), {
            status: nextStatus,
            updatedAt: new Date().toISOString()
        });
    };

    const getTimeElapsed = (isoString: string) => {
        const elapsed = Math.floor((new Date().getTime() - new Date(isoString).getTime()) / 60000);
        return elapsed;
    };

    // Group by status
    const receivedOrders = orders.filter(o => o.status === "Received");
    const preparingOrders = orders.filter(o => o.status === "Preparing");
    const readyOrders = orders.filter(o => o.status === "Ready");

    return (
        <div className="flex" style={{ height: "100vh", overflow: "hidden" }}>
            <Sidebar />

            <main style={{ flex: 1, padding: "var(--spacing-4) var(--spacing-6)", overflowY: "auto" }}>
                <header className="flex justify-between items-center" style={{ marginBottom: "var(--spacing-6)" }}>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-2"><ChefHat /> Kitchen Display System</h1>
                        <p className="text-secondary">Real-time active order queue.</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex items-center gap-2"><span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-primary)" }}></span> Received</div>
                        <div className="flex items-center gap-2"><span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-warning)" }}></span> Preparing</div>
                        <div className="flex items-center gap-2"><span style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--color-success)" }}></span> Ready</div>
                    </div>
                </header>

                <div className="flex gap-6" style={{ height: "calc(100% - 100px)", alignItems: "flex-start", overflowX: "auto" }}>

                    {/* Column: Received */}
                    <div className="flex flex-col gap-4" style={{ minWidth: "320px", width: "320px" }}>
                        <h3 className="font-bold border-b pb-2 flex justify-between" style={{ borderColor: "var(--color-overlay)" }}>
                            <span>Received</span>
                            <span className="text-secondary bg-primary-color px-2 rounded-full text-xs" style={{ background: "var(--color-overlay)", padding: "2px 8px" }}>{receivedOrders.length}</span>
                        </h3>
                        {receivedOrders.map(order => (
                            <OrderCard key={order.id} order={order} color="var(--color-primary)" onAdvance={() => updateOrderStatus(order.id, order.status)} timeElapsed={getTimeElapsed(order.createdAt)} />
                        ))}
                    </div>

                    {/* Column: Preparing */}
                    <div className="flex flex-col gap-4" style={{ minWidth: "320px", width: "320px" }}>
                        <h3 className="font-bold border-b pb-2 flex justify-between" style={{ borderColor: "var(--color-overlay)" }}>
                            <span>Preparing</span>
                            <span className="text-secondary bg-warning px-2 rounded-full text-xs" style={{ background: "var(--color-overlay)", padding: "2px 8px" }}>{preparingOrders.length}</span>
                        </h3>
                        {preparingOrders.map(order => (
                            <OrderCard key={order.id} order={order} color="var(--color-warning)" onAdvance={() => updateOrderStatus(order.id, order.status)} timeElapsed={getTimeElapsed(order.createdAt)} />
                        ))}
                    </div>

                    {/* Column: Ready */}
                    <div className="flex flex-col gap-4" style={{ minWidth: "320px", width: "320px" }}>
                        <h3 className="font-bold border-b pb-2 flex justify-between" style={{ borderColor: "var(--color-overlay)" }}>
                            <span>Ready to Serve</span>
                            <span className="text-secondary bg-success px-2 rounded-full text-xs" style={{ background: "var(--color-overlay)", padding: "2px 8px" }}>{readyOrders.length}</span>
                        </h3>
                        {readyOrders.map(order => (
                            <OrderCard key={order.id} order={order} color="var(--color-success)" onAdvance={() => updateOrderStatus(order.id, order.status)} timeElapsed={getTimeElapsed(order.createdAt)} />
                        ))}
                    </div>

                </div>
            </main>
        </div>
    );
}

function OrderCard({ order, color, onAdvance, timeElapsed }: { order: any, color: string, onAdvance: () => void, timeElapsed: number }) {
    const isBlinking = timeElapsed > 15; // blink if waiting over 15 mins
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
                <h3 className="font-bold text-lg">Table: {order.tableNumber}</h3>
                <div className="flex items-center gap-1 text-sm text-secondary font-mono">
                    <Clock size={14} /> {timeElapsed}m
                </div>
            </div>

            <div className="flex flex-col gap-2 mb-4">
                {order.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start border-b pb-2" style={{ borderColor: "var(--color-icon-bg)" }}>
                        <span className="font-medium">
                            <span className="text-primary-color mr-2">{item.quantity}x</span>
                            {item.name}
                        </span>
                        {item.notes && <p className="text-sm text-secondary block mt-1 w-full bg-black/20 p-1 rounded">Note: {item.notes}</p>}
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
                {order.status === "Received" ? "Start Preparing" : order.status === "Preparing" ? "Mark Ready" : "Mark Served"}
            </button>

            {isBlinking && (
                <style dangerouslySetInnerHTML={{
                    __html: `
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .7; }
          }
        `}} />
            )}
        </div>
    );
}

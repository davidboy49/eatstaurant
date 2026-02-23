"use client";

import { useState, useEffect, useReducer } from "react";
import { collection, onSnapshot, addDoc, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getActiveMenuItems, MenuSchedule } from "@/lib/menu-rotation";
import Sidebar from "@/components/Sidebar";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Utensils } from "lucide-react";

// Types
interface CartItem {
    id: string; // unique cart line id
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    notes?: string;
}

interface OrderState {
    items: CartItem[];
    tableNumber: string | null;
}

type Action =
    | { type: 'ADD_ITEM'; payload: any }
    | { type: 'UPDATE_QTY'; payload: { id: string, delta: number } }
    | { type: 'REMOVE_ITEM'; payload: string }
    | { type: 'CLEAR_CART' }
    | { type: 'SET_TABLE'; payload: string };

function cartReducer(state: OrderState, action: Action): OrderState {
    switch (action.type) {
        case 'ADD_ITEM': {
            const existing = state.items.find(i => i.menuItemId === action.payload.id);
            if (existing) {
                return {
                    ...state,
                    items: state.items.map(i => i.menuItemId === action.payload.id ? { ...i, quantity: i.quantity + 1 } : i)
                };
            }
            return {
                ...state,
                items: [...state.items, {
                    id: Date.now().toString() + Math.random().toString(),
                    menuItemId: action.payload.id,
                    name: action.payload.name,
                    price: action.payload.price,
                    quantity: 1
                }]
            };
        }
        case 'UPDATE_QTY':
            return {
                ...state,
                items: state.items.map(i => i.id === action.payload.id ? { ...i, quantity: Math.max(1, i.quantity + action.payload.delta) } : i)
            };
        case 'REMOVE_ITEM':
            return { ...state, items: state.items.filter(i => i.id !== action.payload) };
        case 'CLEAR_CART':
            return { ...state, items: [] };
        case 'SET_TABLE':
            return { ...state, tableNumber: action.payload };
        default:
            return state;
    }
}

export default function POSPage() {
    const [categories, setCategories] = useState<any[]>([]);
    const [allMenuItems, setAllMenuItems] = useState<any[]>([]);
    const [schedules, setSchedules] = useState<MenuSchedule[]>([]);

    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [orderState, dispatch] = useReducer(cartReducer, { items: [], tableNumber: null });

    // Load Data
    useEffect(() => {
        const unsubCats = onSnapshot(query(collection(db, "categories"), orderBy("sortOrder")), snap => {
            const cats = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setCategories(cats);
            if (cats.length > 0 && !activeCategoryId) setActiveCategoryId(cats[0].id);
        });

        const unsubItems = onSnapshot(collection(db, "menuItems"), snap => {
            setAllMenuItems(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        const unsubScheds = onSnapshot(collection(db, "menuSchedules"), snap => {
            // @ts-ignore
            setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { unsubCats(); unsubItems(); unsubScheds(); }
    }, []);

    // Compute active menu based on rotation engine
    const activeMenu = getActiveMenuItems(allMenuItems, schedules, new Date());

    // Filter by selected category
    const displayItems = activeCategoryId
        ? activeMenu.filter(item => item.categoryId === activeCategoryId)
        : activeMenu;

    // Cart calculations
    const subtotal = orderState.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxRate = 0.08; // 8% placeholder
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    const handleCheckout = async () => {
        if (orderState.items.length === 0) return alert("Cart is empty");

        try {
            await addDoc(collection(db, "orders"), {
                tableNumber: orderState.tableNumber || "Walk-in",
                items: orderState.items,
                status: "Received", // sending to kitchen
                subtotal,
                tax,
                total,
                createdAt: new Date().toISOString()
            });
            alert("Order sent to Kitchen!");
            dispatch({ type: 'CLEAR_CART' });
        } catch (e) {
            console.error(e);
            alert("Failed to submit order");
        }
    };

    return (
        <div className="flex" style={{ height: "100vh", overflow: "hidden" }}>
            <Sidebar />

            {/* Menu Area */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "var(--spacing-4)" }}>
                <header className="flex justify-between items-center" style={{ marginBottom: "var(--spacing-4)" }}>
                    <h1 className="text-2xl font-bold">POS Terminal</h1>
                    <div className="text-secondary text-sm">
                        Active Items: {activeMenu.length}
                    </div>
                </header>

                {/* Categories Navbar */}
                <div className="flex gap-2" style={{ overflowX: "auto", paddingBottom: "var(--spacing-2)", marginBottom: "var(--spacing-4)" }}>
                    <button
                        onClick={() => setActiveCategoryId(null)}
                        style={{
                            padding: "var(--spacing-2) var(--spacing-4)",
                            borderRadius: "var(--radius-full)",
                            background: activeCategoryId === null ? "var(--color-primary)" : "var(--color-icon-bg)",
                            color: activeCategoryId === null ? "white" : "var(--color-text-secondary)",
                            border: "none",
                            cursor: "pointer",
                            whiteSpace: "nowrap",
                            fontWeight: "bold"
                        }}
                    >
                        All Items
                    </button>
                    {categories.filter(c => c.isActive).map(cat => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategoryId(cat.id)}
                            style={{
                                padding: "var(--spacing-2) var(--spacing-4)",
                                borderRadius: "var(--radius-full)",
                                background: activeCategoryId === cat.id ? "var(--color-primary)" : "var(--color-icon-bg)",
                                color: activeCategoryId === cat.id ? "white" : "var(--color-text-secondary)",
                                border: "none",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                fontWeight: "bold"
                            }}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>

                {/* Menu Grid */}
                <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "var(--spacing-4)", alignContent: "start" }}>
                    {displayItems.length === 0 ? (
                        <div className="text-secondary" style={{ gridColumn: "1/-1", textAlign: "center", padding: "2rem" }}>
                            No active items available for this selected category / current time.
                        </div>
                    ) : (
                        displayItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => dispatch({ type: 'ADD_ITEM', payload: item })}
                                className="glass-panel flex flex-col items-center justify-center p-4 transition-transform"
                                style={{
                                    aspectRatio: "1",
                                    cursor: "pointer",
                                    border: "1px solid var(--color-overlay)",
                                    padding: "var(--spacing-4)",
                                    textAlign: "center"
                                }}
                            >
                                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Utensils size={32} color="var(--color-primary)" style={{ opacity: 0.8 }} />
                                </div>
                                <div style={{ width: "100%" }}>
                                    <div className="font-bold truncate text-sm" title={item.name}>{item.name}</div>
                                    <div className="text-primary-color font-bold mt-1">${Number(item.price).toFixed(2)}</div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Cart Sidebar */}
            <div className="glass-panel flex flex-col" style={{ width: "350px", borderLeft: "1px solid var(--color-overlay)", padding: "var(--spacing-4)" }}>
                <div className="flex items-center gap-2 mb-4" style={{ marginBottom: "var(--spacing-4)" }}>
                    <ShoppingCart size={20} />
                    <h2 className="text-xl font-bold">Current Order</h2>
                </div>

                <div className="flex items-center gap-2" style={{ marginBottom: "var(--spacing-4)" }}>
                    <label className="text-sm font-medium text-secondary">Table/Name:</label>
                    <input
                        type="text"
                        placeholder="e.g. T12 or 'Walk-in'"
                        value={orderState.tableNumber || ""}
                        onChange={e => dispatch({ type: 'SET_TABLE', payload: e.target.value })}
                        className="glass-panel text-sm"
                        style={{ padding: "var(--spacing-2)", background: "var(--color-icon-bg)", flex: 1, border: "none", color: "var(--color-text-primary)" }}
                    />
                </div>

                {/* Cart Items */}
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                    {orderState.items.length === 0 && (
                        <div className="text-secondary text-sm text-center" style={{ marginTop: "2rem" }}>Cart is empty</div>
                    )}
                    {orderState.items.map(item => (
                        <div key={item.id} className="flex flex-col gap-2" style={{ padding: "var(--spacing-2)", borderBottom: "1px solid var(--color-icon-bg)" }}>
                            <div className="flex justify-between font-medium">
                                <span>{item.name}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2 items-center">
                                    <button onClick={() => dispatch({ type: 'UPDATE_QTY', payload: { id: item.id, delta: -1 } })} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "none", background: "var(--color-overlay)", color: "var(--color-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={12} /></button>
                                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => dispatch({ type: 'UPDATE_QTY', payload: { id: item.id, delta: 1 } })} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "none", background: "var(--color-overlay)", color: "var(--color-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={12} /></button>
                                </div>
                                <button onClick={() => dispatch({ type: 'REMOVE_ITEM', payload: item.id })} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer" }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Totals */}
                <div style={{ paddingTop: "var(--spacing-4)", marginTop: "auto", borderTop: "1px solid var(--color-overlay)" }}>
                    <div className="flex justify-between text-sm text-secondary mb-1">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-secondary mb-3">
                        <span>Tax (8%)</span>
                        <span>${tax.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold mb-4 text-primary-color">
                        <span>Total</span>
                        <span>${total.toFixed(2)}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={orderState.items.length === 0}
                        className="w-full flex justify-center items-center gap-2"
                        style={{
                            padding: "var(--spacing-4)",
                            background: orderState.items.length === 0 ? "var(--color-overlay)" : "var(--color-primary)",
                            color: "var(--color-text-primary)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            fontWeight: "bold",
                            cursor: orderState.items.length === 0 ? "not-allowed" : "pointer"
                        }}
                    >
                        <CreditCard size={20} /> Checkout & Send to KDS
                    </button>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect, useReducer, useMemo } from "react";
import { collection, onSnapshot, addDoc, query, orderBy, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getActiveMenuItems, MenuSchedule } from "@/lib/menu-rotation";
import Sidebar from "@/components/Sidebar";
import { ShoppingCart, Plus, Minus, Trash2, CreditCard, Utensils, FileDown } from "lucide-react";

interface Category {
    id: string;
    name: string;
    isActive?: boolean;
    sortOrder?: number;
}

interface MenuItem {
    id: string;
    categoryId: string;
    name: string;
    price: number;
    isActive?: boolean;
}

interface CartItem {
    id: string;
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

interface StoreSettings {
    restaurantName: string;
    taxRate: number;
    currency: string;
    receiptHeader: string;
    receiptFooter: string;
}

interface CheckoutSnapshot {
    orderNumber: string;
    tableNumber: string;
    createdAt: string;
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
}

type Action =
    | { type: "ADD_ITEM"; payload: MenuItem }
    | { type: "UPDATE_QTY"; payload: { id: string; delta: number } }
    | { type: "REMOVE_ITEM"; payload: string }
    | { type: "CLEAR_CART" }
    | { type: "SET_TABLE"; payload: string };

const defaultSettings: StoreSettings = {
    restaurantName: "Eatstaurant",
    taxRate: 8,
    currency: "USD",
    receiptHeader: "",
    receiptFooter: "Thank you for dining with us!"
};

function cartReducer(state: OrderState, action: Action): OrderState {
    switch (action.type) {
        case "ADD_ITEM": {
            const existing = state.items.find((i) => i.menuItemId === action.payload.id);
            if (existing) {
                return {
                    ...state,
                    items: state.items.map((i) =>
                        i.menuItemId === action.payload.id ? { ...i, quantity: i.quantity + 1 } : i
                    )
                };
            }
            return {
                ...state,
                items: [
                    ...state.items,
                    {
                        id: Date.now().toString() + Math.random().toString(),
                        menuItemId: action.payload.id,
                        name: action.payload.name,
                        price: Number(action.payload.price || 0),
                        quantity: 1
                    }
                ]
            };
        }
        case "UPDATE_QTY":
            return {
                ...state,
                items: state.items.map((i) =>
                    i.id === action.payload.id
                        ? { ...i, quantity: Math.max(1, i.quantity + action.payload.delta) }
                        : i
                )
            };
        case "REMOVE_ITEM":
            return { ...state, items: state.items.filter((i) => i.id !== action.payload) };
        case "CLEAR_CART":
            return { ...state, items: [] };
        case "SET_TABLE":
            return { ...state, tableNumber: action.payload };
        default:
            return state;
    }
}

const formatCurrency = (amount: number, currency: string) => {
    try {
        return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
    } catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
};

const escapePdfText = (text: string) => text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");

function buildReceiptPdf(settings: StoreSettings, receipt: CheckoutSnapshot) {
    const lines: string[] = [];
    lines.push(settings.restaurantName || "Eatstaurant");
    lines.push(...(settings.receiptHeader ? settings.receiptHeader.split("\n") : []));
    lines.push("----------------------------------------");
    lines.push(`Receipt #: ${receipt.orderNumber}`);
    lines.push(`Table/Name: ${receipt.tableNumber}`);
    lines.push(`Date: ${new Date(receipt.createdAt).toLocaleString()}`);
    lines.push("----------------------------------------");

    receipt.items.forEach((item) => {
        lines.push(`${item.quantity}x ${item.name}`);
        lines.push(`   ${formatCurrency(item.price, settings.currency)} x ${item.quantity} = ${formatCurrency(item.price * item.quantity, settings.currency)}`);
        if (item.notes) lines.push(`   Note: ${item.notes}`);
    });

    lines.push("----------------------------------------");
    lines.push(`Subtotal: ${formatCurrency(receipt.subtotal, settings.currency)}`);
    lines.push(`Tax (${settings.taxRate}%): ${formatCurrency(receipt.tax, settings.currency)}`);
    lines.push(`TOTAL: ${formatCurrency(receipt.total, settings.currency)}`);
    if (settings.receiptFooter) {
        lines.push("----------------------------------------");
        lines.push(...settings.receiptFooter.split("\n"));
    }

    const pageHeight = 792;
    const startY = pageHeight - 50;
    const lineHeight = 14;

    const content = lines
        .map((line, idx) => `BT /F1 10 Tf 35 ${startY - idx * lineHeight} Td (${escapePdfText(line)}) Tj ET`)
        .join("\n");

    const objects = [
        "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj",
        "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj",
        "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj",
        "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj",
        `5 0 obj\n<< /Length ${content.length} >>\nstream\n${content}\nendstream\nendobj`
    ];

    const header = "%PDF-1.4\n";
    const body = objects.join("\n");

    let offset = header.length;
    const xrefOffsets = ["0000000000 65535 f "];
    for (const object of objects) {
        xrefOffsets.push(`${offset.toString().padStart(10, "0")} 00000 n `);
        offset += object.length + 1;
    }

    const xrefStart = offset;
    const xref = `xref\n0 ${objects.length + 1}\n${xrefOffsets.join("\n")}\n`;
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    return new Blob([header, body, "\n", xref, trailer], { type: "application/pdf" });
}

export default function POSPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [allMenuItems, setAllMenuItems] = useState<MenuItem[]>([]);
    const [schedules, setSchedules] = useState<MenuSchedule[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
    const [checkoutInProgress, setCheckoutInProgress] = useState(false);
    const [latestReceipt, setLatestReceipt] = useState<CheckoutSnapshot | null>(null);
    const [orderState, dispatch] = useReducer(cartReducer, { items: [], tableNumber: null });

    useEffect(() => {
        if (!db) return;
        const unsubCats = onSnapshot(query(collection(db, "categories"), orderBy("sortOrder")), (snap) => {
            const cats = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Category, "id">) }));
            setCategories(cats);
            if (cats.length > 0 && !activeCategoryId) setActiveCategoryId(cats[0].id);
        });

        const unsubItems = onSnapshot(collection(db, "menuItems"), (snap) => {
            setAllMenuItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MenuItem, "id">) })));
        });

        const unsubScheds = onSnapshot(collection(db, "menuSchedules"), (snap) => {
            setSchedules(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<MenuSchedule, "id">) })) as MenuSchedule[]);
        });

        getDoc(doc(db, "settings", "general"))
            .then((settingsDoc) => {
                if (!settingsDoc.exists()) return;
                const data = settingsDoc.data();
                setSettings({
                    restaurantName: data.restaurantName || defaultSettings.restaurantName,
                    taxRate: Number(data.taxRate || defaultSettings.taxRate),
                    currency: data.currency || defaultSettings.currency,
                    receiptHeader: data.receiptHeader || defaultSettings.receiptHeader,
                    receiptFooter: data.receiptFooter || defaultSettings.receiptFooter
                });
            })
            .catch((error) => console.error("Failed to load store settings:", error));

        return () => {
            unsubCats();
            unsubItems();
            unsubScheds();
        };
    }, [activeCategoryId]);

    const activeMenu = getActiveMenuItems(allMenuItems, schedules, new Date());
    const displayItems = activeCategoryId
        ? activeMenu.filter((item) => item.categoryId === activeCategoryId)
        : activeMenu;

    const subtotal = useMemo(
        () => orderState.items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        [orderState.items]
    );
    const taxRateDecimal = Math.max(0, Number(settings.taxRate || 0)) / 100;
    const tax = subtotal * taxRateDecimal;
    const total = subtotal + tax;

    const downloadReceipt = (receiptData: CheckoutSnapshot) => {
        const pdfBlob = buildReceiptPdf(settings, receiptData);
        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `receipt-${receiptData.orderNumber}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleCheckout = async () => {
        if (orderState.items.length === 0) return alert("Cart is empty.");
        if (checkoutInProgress) return;

        const tableLabel = (orderState.tableNumber || "").trim() || "Walk-in";
        const createdAt = new Date().toISOString();
        const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;

        setCheckoutInProgress(true);
        try {
            if (!db) return alert("Missing database connection.");
            await addDoc(collection(db, "orders"), {
                orderNumber,
                tableNumber: tableLabel,
                items: orderState.items,
                status: "Received",
                subtotal,
                tax,
                total,
                taxRate: settings.taxRate,
                currency: settings.currency,
                createdAt,
                updatedAt: createdAt
            });

            const receiptData: CheckoutSnapshot = {
                orderNumber,
                tableNumber: tableLabel,
                createdAt,
                items: orderState.items,
                subtotal,
                tax,
                total
            };
            setLatestReceipt(receiptData);
            downloadReceipt(receiptData);
            alert("Order sent to kitchen and PDF receipt downloaded.");
            dispatch({ type: "CLEAR_CART" });
        } catch (e) {
            console.error(e);
            alert("Failed to submit order.");
        } finally {
            setCheckoutInProgress(false);
        }
    };

    return (
        <div className="flex" style={{ height: "100vh", overflow: "hidden" }}>
            <Sidebar />

            <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "var(--spacing-4)" }}>
                <header className="flex justify-between items-center" style={{ marginBottom: "var(--spacing-4)" }}>
                    <h1 className="text-2xl font-bold">POS Terminal</h1>
                    <div className="text-secondary text-sm">Active Items: {activeMenu.length}</div>
                </header>

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
                    {categories
                        .filter((c) => c.isActive)
                        .map((cat) => (
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

                <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "var(--spacing-4)", alignContent: "start" }}>
                    {displayItems.length === 0 ? (
                        <div className="text-secondary" style={{ gridColumn: "1/-1", textAlign: "center", padding: "2rem" }}>
                            No active items available for this selected category / current time.
                        </div>
                    ) : (
                        displayItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => dispatch({ type: "ADD_ITEM", payload: item })}
                                className="glass-panel flex flex-col items-center justify-center p-4 transition-transform"
                                style={{ aspectRatio: "1", cursor: "pointer", border: "1px solid var(--color-overlay)", padding: "var(--spacing-4)", textAlign: "center" }}
                            >
                                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                                    <Utensils size={32} color="var(--color-primary)" style={{ opacity: 0.8 }} />
                                </div>
                                <div style={{ width: "100%" }}>
                                    <div className="font-bold truncate text-sm" title={item.name}>
                                        {item.name}
                                    </div>
                                    <div className="text-primary-color font-bold mt-1">
                                        {formatCurrency(Number(item.price || 0), settings.currency)}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

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
                        onChange={(e) => dispatch({ type: "SET_TABLE", payload: e.target.value })}
                        className="glass-panel text-sm"
                        style={{ padding: "var(--spacing-2)", background: "var(--color-icon-bg)", flex: 1, border: "none", color: "var(--color-text-primary)" }}
                    />
                </div>

                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--spacing-3)" }}>
                    {orderState.items.length === 0 && (
                        <div className="text-secondary text-sm text-center" style={{ marginTop: "2rem" }}>
                            Cart is empty
                        </div>
                    )}
                    {orderState.items.map((item) => (
                        <div key={item.id} className="flex flex-col gap-2" style={{ padding: "var(--spacing-2)", borderBottom: "1px solid var(--color-icon-bg)" }}>
                            <div className="flex justify-between font-medium">
                                <span>{item.name}</span>
                                <span>{formatCurrency(item.price * item.quantity, settings.currency)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2 items-center">
                                    <button onClick={() => dispatch({ type: "UPDATE_QTY", payload: { id: item.id, delta: -1 } })} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "none", background: "var(--color-overlay)", color: "var(--color-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus size={12} /></button>
                                    <span className="text-sm w-4 text-center">{item.quantity}</span>
                                    <button onClick={() => dispatch({ type: "UPDATE_QTY", payload: { id: item.id, delta: 1 } })} style={{ width: "24px", height: "24px", borderRadius: "50%", border: "none", background: "var(--color-overlay)", color: "var(--color-text-primary)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus size={12} /></button>
                                </div>
                                <button onClick={() => dispatch({ type: "REMOVE_ITEM", payload: item.id })} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer" }}><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ paddingTop: "var(--spacing-4)", marginTop: "auto", borderTop: "1px solid var(--color-overlay)" }}>
                    <div className="flex justify-between text-sm text-secondary mb-1">
                        <span>Subtotal</span>
                        <span>{formatCurrency(subtotal, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-secondary mb-3">
                        <span>Tax ({settings.taxRate}%)</span>
                        <span>{formatCurrency(tax, settings.currency)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold mb-4 text-primary-color">
                        <span>Total</span>
                        <span>{formatCurrency(total, settings.currency)}</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        disabled={orderState.items.length === 0 || checkoutInProgress}
                        className="w-full flex justify-center items-center gap-2"
                        style={{
                            padding: "var(--spacing-4)",
                            background: orderState.items.length === 0 || checkoutInProgress ? "var(--color-overlay)" : "var(--color-primary)",
                            color: "var(--color-text-primary)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            fontWeight: "bold",
                            cursor: orderState.items.length === 0 || checkoutInProgress ? "not-allowed" : "pointer"
                        }}
                    >
                        <CreditCard size={20} /> {checkoutInProgress ? "Processing..." : "Checkout & Send to KDS"}
                    </button>

                    {latestReceipt && (
                        <button
                            onClick={() => downloadReceipt(latestReceipt)}
                            className="w-full flex justify-center items-center gap-2"
                            style={{
                                marginTop: "var(--spacing-2)",
                                padding: "var(--spacing-3)",
                                background: "var(--color-icon-bg)",
                                color: "var(--color-text-primary)",
                                border: "1px solid var(--color-overlay)",
                                borderRadius: "var(--radius-md)",
                                fontWeight: "bold",
                                cursor: "pointer"
                            }}
                        >
                            <FileDown size={16} /> Download Last Receipt PDF
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function SettingsManagement() {
    const [restaurantName, setRestaurantName] = useState("");
    const [taxRate, setTaxRate] = useState("8.00");
    const [currency, setCurrency] = useState("USD");
    const [receiptHeader, setReceiptHeader] = useState("");
    const [receiptFooter, setReceiptFooter] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const d = await getDoc(doc(db, "settings", "general"));
                if (d.exists()) {
                    const data = d.data();
                    setRestaurantName(data.restaurantName || "");
                    setTaxRate(data.taxRate || "8.00");
                    setCurrency(data.currency || "USD");
                    setReceiptHeader(data.receiptHeader || "");
                    setReceiptFooter(data.receiptFooter || "");
                }
            } catch (error) {
                console.error("Failed to load settings:", error);
            } finally {
                setLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await setDoc(doc(db, "settings", "general"), {
                restaurantName,
                taxRate,
                currency,
                receiptHeader,
                receiptFooter,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            alert("Settings saved successfully.");
        } catch (error) {
            console.error(error);
            alert("Failed to save settings.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4 text-secondary">Loading settings...</div>;

    return (
        <div className="flex flex-col gap-6" style={{ height: "100%", maxWidth: "800px" }}>
            <header style={{ marginBottom: "var(--spacing-4)" }}>
                <h1 className="text-2xl font-bold">Store Settings</h1>
                <p className="text-secondary">Configure global application and receipt settings.</p>
            </header>

            <form onSubmit={handleSave} className="glass-panel flex flex-col gap-6" style={{ padding: "var(--spacing-6)" }}>
                {/* General Details */}
                <div>
                    <h3 className="text-lg font-bold mb-4" style={{ borderBottom: "1px solid var(--color-overlay)", paddingBottom: "var(--spacing-2)" }}>General Details</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-secondary">Restaurant Name</label>
                            <input
                                type="text"
                                value={restaurantName}
                                onChange={e => setRestaurantName(e.target.value)}
                                placeholder="Eatstaurant Main Branch"
                                className="glass-panel border"
                                style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", borderColor: "var(--color-overlay)", color: "var(--color-text-primary)" }}
                            />
                        </div>

                        <div className="flex gap-4">
                            <div className="flex flex-col gap-2 flex-1">
                                <label className="text-sm font-medium text-secondary">Tax Rate (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={taxRate}
                                    onChange={e => setTaxRate(e.target.value)}
                                    className="glass-panel border"
                                    style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", borderColor: "var(--color-overlay)", color: "var(--color-text-primary)" }}
                                />
                            </div>
                            <div className="flex flex-col gap-2 flex-1">
                                <label className="text-sm font-medium text-secondary">Currency Code</label>
                                <input
                                    type="text"
                                    value={currency}
                                    onChange={e => setCurrency(e.target.value)}
                                    placeholder="USD"
                                    className="glass-panel border"
                                    style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", borderColor: "var(--color-overlay)", color: "var(--color-text-primary)" }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Receipt Configuration */}
                <div>
                    <h3 className="text-lg font-bold mb-4" style={{ borderBottom: "1px solid var(--color-overlay)", paddingBottom: "var(--spacing-2)" }}>Receipt Configuration</h3>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-secondary">Receipt Header Message</label>
                            <textarea
                                rows={3}
                                value={receiptHeader}
                                onChange={e => setReceiptHeader(e.target.value)}
                                placeholder="123 Food Street, City, State&#10;Tel: (555) 123-4567"
                                className="glass-panel border"
                                style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", borderColor: "var(--color-overlay)", color: "var(--color-text-primary)", resize: "none" }}
                            />
                            <span className="text-xs text-secondary">Prints at the top of the receipt.</span>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-secondary">Receipt Footer Message</label>
                            <textarea
                                rows={2}
                                value={receiptFooter}
                                onChange={e => setReceiptFooter(e.target.value)}
                                placeholder="Thank you for dining with us!"
                                className="glass-panel border"
                                style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", borderColor: "var(--color-overlay)", color: "var(--color-text-primary)", resize: "none" }}
                            />
                            <span className="text-xs text-secondary">Prints at the bottom of the receipt.</span>
                        </div>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={saving}
                    className="flex justify-center items-center gap-2"
                    style={{
                        marginTop: "var(--spacing-4)",
                        padding: "var(--spacing-3)",
                        background: "var(--color-primary)",
                        color: "var(--color-text-primary)",
                        border: "none",
                        borderRadius: "var(--radius-md)",
                        fontWeight: "bold",
                        cursor: saving ? "not-allowed" : "pointer"
                    }}
                >
                    {saving ? "Saving..." : "Save Settings"}
                </button>
            </form>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    orderBy
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit, Trash2, X } from "lucide-react";

export default function MenuManagement() {
    const [activeTab, setActiveTab] = useState("items");
    const [categories, setCategories] = useState<any[]>([]);
    const [items, setItems] = useState<any[]>([]);

    // Modals state
    const [isCategoryModalOpen, setCategoryModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<any>(null);

    const [isItemModalOpen, setItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    useEffect(() => {
        if (!db) return;
        // Fetch Categories
        const qCat = query(collection(db, "categories"), orderBy("sortOrder", "asc"));
        const unsubCat = onSnapshot(qCat, (snapshot) => {
            setCategories(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        // Fetch Items
        const qItems = query(collection(db, "menuItems"));
        const unsubItems = onSnapshot(qItems, (snapshot) => {
            setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
            unsubCat();
            unsubItems();
        };
    }, []);

    const handleDeleteCategory = async (id: string) => {
        if (confirm("Are you sure you want to delete this category?")) {
            if (!db) return alert("Missing database connection.");
            await deleteDoc(doc(db, "categories", id));
        }
    };

    const handleDeleteItem = async (id: string) => {
        if (confirm("Are you sure you want to delete this menu item?")) {
            if (!db) return alert("Missing database connection.");
            await deleteDoc(doc(db, "menuItems", id));
        }
    };

    return (
        <div className="flex flex-col gap-6" style={{ height: "100%" }}>
            <header className="flex items-center justify-between" style={{ marginBottom: "var(--spacing-4)" }}>
                <div>
                    <h1 className="text-2xl font-bold">Menu Management</h1>
                    <p className="text-secondary">Manage your menu categories and items.</p>
                </div>
                <div className="flex gap-2">
                    <a
                        href="/admin/menu/schedules"
                        className="flex items-center gap-2 font-medium"
                        style={{
                            padding: "var(--spacing-2) var(--spacing-4)",
                            background: "var(--color-overlay)",
                            border: "1px solid var(--color-overlay)",
                            borderRadius: "var(--radius-md)",
                            color: "var(--color-text-primary)",
                            textDecoration: "none"
                        }}
                    >
                        Manage Schedules
                    </a>
                    <button
                        className="flex items-center gap-2"
                        onClick={() => {
                            setEditingCategory(null);
                            setCategoryModalOpen(true);
                        }}
                        style={{
                            padding: "var(--spacing-2) var(--spacing-4)",
                            background: "var(--color-overlay)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            color: "var(--color-text-primary)",
                            cursor: "pointer"
                        }}
                    >
                        <Plus size={16} /> New Category
                    </button>
                    <button
                        className="flex items-center gap-2"
                        onClick={() => {
                            setEditingItem(null);
                            setItemModalOpen(true);
                        }}
                        style={{
                            padding: "var(--spacing-2) var(--spacing-4)",
                            background: "var(--color-primary)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            color: "var(--color-text-primary)",
                            cursor: "pointer",
                            fontWeight: "bold"
                        }}
                    >
                        <Plus size={16} /> New Item
                    </button>
                </div>
            </header>

            {/* Tabs */}
            <div className="flex gap-4 border-b" style={{ borderBottom: "1px solid var(--color-overlay)", paddingBottom: "var(--spacing-2)" }}>
                <button
                    onClick={() => setActiveTab("items")}
                    className={`font-semibold ${activeTab === "items" ? "text-primary-color" : "text-secondary"}`}
                    style={{ background: "none", border: "none", padding: "var(--spacing-2)", cursor: "pointer" }}
                >
                    Menu Items
                </button>
                <button
                    onClick={() => setActiveTab("categories")}
                    className={`font-semibold ${activeTab === "categories" ? "text-primary-color" : "text-secondary"}`}
                    style={{ background: "none", border: "none", padding: "var(--spacing-2)", cursor: "pointer" }}
                >
                    Categories
                </button>
            </div>

            {/* Content */}
            <div className="glass-panel" style={{ flex: 1, padding: "var(--spacing-4)", overflowY: "auto" }}>
                {activeTab === "categories" && (
                    <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-overlay)", color: "var(--color-text-secondary)" }}>
                                <th style={{ padding: "var(--spacing-3)" }}>Name</th>
                                <th style={{ padding: "var(--spacing-3)" }}>Sort Order</th>
                                <th style={{ padding: "var(--spacing-3)" }}>Status</th>
                                <th style={{ padding: "var(--spacing-3)", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(cat => (
                                <tr key={cat.id} style={{ borderBottom: "1px solid var(--color-icon-bg)" }}>
                                    <td style={{ padding: "var(--spacing-3)" }} className="font-medium">{cat.name}</td>
                                    <td style={{ padding: "var(--spacing-3)" }}>{cat.sortOrder}</td>
                                    <td style={{ padding: "var(--spacing-3)" }}>
                                        <span style={{
                                            padding: "2px 8px",
                                            borderRadius: "var(--radius-full)",
                                            background: cat.isActive ? "rgba(0,200,100,0.2)" : "var(--color-overlay)",
                                            color: cat.isActive ? "var(--color-success)" : "var(--color-text-secondary)",
                                            fontSize: "0.75rem"
                                        }}>
                                            {cat.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "var(--spacing-3)", textAlign: "right" }}>
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => { setEditingCategory(cat); setCategoryModalOpen(true); }}
                                                style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteCategory(cat.id)}
                                                style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer" }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {categories.length === 0 && (
                                <tr><td colSpan={4} style={{ padding: "var(--spacing-4)", textAlign: "center", color: "var(--color-text-secondary)" }}>No categories found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}

                {activeTab === "items" && (
                    <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                        <thead>
                            <tr style={{ borderBottom: "1px solid var(--color-overlay)", color: "var(--color-text-secondary)" }}>
                                <th style={{ padding: "var(--spacing-3)" }}>Name</th>
                                <th style={{ padding: "var(--spacing-3)" }}>Category</th>
                                <th style={{ padding: "var(--spacing-3)" }}>Price</th>
                                <th style={{ padding: "var(--spacing-3)" }}>Status</th>
                                <th style={{ padding: "var(--spacing-3)", textAlign: "right" }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map(item => (
                                <tr key={item.id} style={{ borderBottom: "1px solid var(--color-icon-bg)" }}>
                                    <td style={{ padding: "var(--spacing-3)" }}>
                                        <div>
                                            <div className="font-medium">{item.name}</div>
                                            <div className="text-sm text-secondary truncate" style={{ maxWidth: "200px" }}>{item.description}</div>
                                        </div>
                                    </td>
                                    <td style={{ padding: "var(--spacing-3)" }}>
                                        {categories.find(c => c.id === item.categoryId)?.name || "Unknown"}
                                    </td>
                                    <td style={{ padding: "var(--spacing-3)" }}>${Number(item.price).toFixed(2)}</td>
                                    <td style={{ padding: "var(--spacing-3)" }}>
                                        <span style={{
                                            padding: "2px 8px",
                                            borderRadius: "var(--radius-full)",
                                            background: item.isActive ? "rgba(0,200,100,0.2)" : "var(--color-overlay)",
                                            color: item.isActive ? "var(--color-success)" : "var(--color-text-secondary)",
                                            fontSize: "0.75rem"
                                        }}>
                                            {item.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </td>
                                    <td style={{ padding: "var(--spacing-3)", textAlign: "right" }}>
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                onClick={() => { setEditingItem(item); setItemModalOpen(true); }}
                                                style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteItem(item.id)}
                                                style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer" }}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr><td colSpan={5} style={{ padding: "var(--spacing-4)", textAlign: "center", color: "var(--color-text-secondary)" }}>No items found.</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            {isCategoryModalOpen && (
                <CategoryModal onClose={() => setCategoryModalOpen(false)} category={editingCategory} />
            )}

            {isItemModalOpen && (
                <ItemModal onClose={() => setItemModalOpen(false)} item={editingItem} categories={categories} />
            )}
        </div>
    );
}

function CategoryModal({ onClose, category }: { onClose: () => void, category: any }) {
    const [name, setName] = useState(category?.name || "");
    const [sortOrder, setSortOrder] = useState(category?.sortOrder || 0);
    const [isActive, setIsActive] = useState(category ? category.isActive : true);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name, sortOrder: Number(sortOrder), isActive };
        if (!db) return alert("Missing database connection.");
        if (category?.id) {
            await updateDoc(doc(db, "categories", category.id), data);
        } else {
            await addDoc(collection(db, "categories"), data);
        }
        onClose();
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            <div className="glass-panel" style={{ padding: "var(--spacing-6)", width: "100%", maxWidth: "400px" }}>
                <div className="flex justify-between items-center" style={{ marginBottom: "var(--spacing-4)" }}>
                    <h2 className="text-xl font-bold">{category ? "Edit Category" : "New Category"}</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-text-primary)", cursor: "pointer" }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSave} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Name</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)}
                            className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)" }} />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Sort Order</label>
                        <input type="number" required value={sortOrder} onChange={e => setSortOrder(e.target.value)}
                            className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)" }} />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} id="cat-active" />
                        <label htmlFor="cat-active" className="text-sm">Active</label>
                    </div>
                    <button type="submit" style={{ padding: "var(--spacing-3)", background: "var(--color-primary)", color: "var(--color-text-primary)", border: "none", borderRadius: "var(--radius-md)", fontWeight: "bold", cursor: "pointer", marginTop: "var(--spacing-2)" }}>
                        Save Category
                    </button>
                </form>
            </div>
        </div>
    );
}

function ItemModal({ onClose, item, categories }: { onClose: () => void, item: any, categories: any[] }) {
    const [name, setName] = useState(item?.name || "");
    const [description, setDescription] = useState(item?.description || "");
    const [price, setPrice] = useState(item?.price || 0);
    const [categoryId, setCategoryId] = useState(item?.categoryId || (categories.length > 0 ? categories[0].id : ""));
    const [isActive, setIsActive] = useState(item ? item.isActive : true);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name, description, price: Number(price), categoryId, isActive };
        if (!db) return alert("Missing database connection.");
        if (item?.id) {
            await updateDoc(doc(db, "menuItems", item.id), data);
        } else {
            await addDoc(collection(db, "menuItems"), data);
        }
        onClose();
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
            <div className="glass-panel" style={{ padding: "var(--spacing-6)", width: "100%", maxWidth: "500px" }}>
                <div className="flex justify-between items-center" style={{ marginBottom: "var(--spacing-4)" }}>
                    <h2 className="text-xl font-bold">{item ? "Edit Item" : "New Menu Item"}</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-text-primary)", cursor: "pointer" }}><X size={20} /></button>
                </div>
                <form onSubmit={handleSave} className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <div className="flex flex-col gap-2" style={{ flex: 2 }}>
                            <label className="text-sm font-medium">Name</label>
                            <input type="text" required value={name} onChange={e => setName(e.target.value)}
                                className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)" }} />
                        </div>
                        <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                            <label className="text-sm font-medium">Price ($)</label>
                            <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)}
                                className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)" }} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Category</label>
                        <select required value={categoryId} onChange={e => setCategoryId(e.target.value)}
                            className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)" }}>
                            {categories.map(c => <option key={c.id} value={c.id} style={{ color: "black" }}>{c.name}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Description</label>
                        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
                            className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)", resize: "none" }} />
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} id="item-active" />
                        <label htmlFor="item-active" className="text-sm">Active</label>
                    </div>

                    <button type="submit" style={{ padding: "var(--spacing-3)", background: "var(--color-primary)", color: "var(--color-text-primary)", border: "none", borderRadius: "var(--radius-md)", fontWeight: "bold", cursor: "pointer", marginTop: "var(--spacing-2)" }}>
                        Save Item
                    </button>
                </form>
            </div>
        </div>
    );
}

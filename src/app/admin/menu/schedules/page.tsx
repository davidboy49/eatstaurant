"use client";

import { useState, useEffect } from "react";
import {
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit, Trash2, X, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { MenuSchedule } from "@/lib/menu-rotation";

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function SchedulesManagement() {
    const [schedules, setSchedules] = useState<MenuSchedule[]>([]);
    const [items, setItems] = useState<any[]>([]);

    // Modals state
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<MenuSchedule | null>(null);

    useEffect(() => {
        if (!db) return;
        const qSchedules = query(collection(db, "menuSchedules"));
        const unsubSchedules = onSnapshot(qSchedules, (snapshot) => {
            setSchedules(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as MenuSchedule)));
        });

        const qItems = query(collection(db, "menuItems"));
        const unsubItems = onSnapshot(qItems, (snapshot) => {
            setItems(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => {
            unsubSchedules();
            unsubItems();
        };
    }, []);

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this schedule?")) {
            if (!db) return alert("Missing database connection.");
            await deleteDoc(doc(db, "menuSchedules", id));
        }
    };

    return (
        <div className="flex flex-col gap-6" style={{ height: "100%" }}>
            <header className="flex items-center justify-between" style={{ marginBottom: "var(--spacing-4)" }}>
                <div>
                    <Link href="/admin/menu" className="flex items-center gap-2 text-primary-color text-sm" style={{ marginBottom: "var(--spacing-2)", textDecoration: "none" }}>
                        <ArrowLeft size={16} /> Back to Menu
                    </Link>
                    <h1 className="text-2xl font-bold">Menu Schedules</h1>
                    <p className="text-secondary">Define when specific items are available on the POS.</p>
                </div>
                <button
                    className="flex items-center gap-2"
                    onClick={() => {
                        setEditingSchedule(null);
                        setModalOpen(true);
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
                    <Plus size={16} /> New Schedule
                </button>
            </header>

            {/* Content */}
            <div className="glass-panel" style={{ flex: 1, padding: "var(--spacing-4)", overflowY: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-overlay)", color: "var(--color-text-secondary)" }}>
                            <th style={{ padding: "var(--spacing-3)" }}>Name</th>
                            <th style={{ padding: "var(--spacing-3)" }}>Days</th>
                            <th style={{ padding: "var(--spacing-3)" }}>Time Window</th>
                            <th style={{ padding: "var(--spacing-3)" }}>Items Count</th>
                            <th style={{ padding: "var(--spacing-3)" }}>Status</th>
                            <th style={{ padding: "var(--spacing-3)", textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {schedules.map(schedule => (
                            <tr key={schedule.id} style={{ borderBottom: "1px solid var(--color-icon-bg)" }}>
                                <td style={{ padding: "var(--spacing-3)" }} className="font-medium">{schedule.name}</td>
                                <td style={{ padding: "var(--spacing-3)" }}>
                                    <div className="flex flex-wrap gap-1">
                                        {schedule.daysOfWeek.map(d => (
                                            <span key={d} style={{ background: "var(--color-overlay)", padding: "2px 6px", borderRadius: "4px", fontSize: "0.75rem" }}>
                                                {DAYS_OF_WEEK[d].substring(0, 3)}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td style={{ padding: "var(--spacing-3)" }}>{schedule.startTime} - {schedule.endTime}</td>
                                <td style={{ padding: "var(--spacing-3)" }}>{schedule.menuItemIds?.length || 0}</td>
                                <td style={{ padding: "var(--spacing-3)" }}>
                                    <span style={{
                                        padding: "2px 8px",
                                        borderRadius: "var(--radius-full)",
                                        background: schedule.isActive ? "rgba(0,200,100,0.2)" : "var(--color-overlay)",
                                        color: schedule.isActive ? "var(--color-success)" : "var(--color-text-secondary)",
                                        fontSize: "0.75rem"
                                    }}>
                                        {schedule.isActive ? "Active" : "Inactive"}
                                    </span>
                                </td>
                                <td style={{ padding: "var(--spacing-3)", textAlign: "right" }}>
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => { setEditingSchedule(schedule); setModalOpen(true); }}
                                            style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer" }}
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(schedule.id)}
                                            style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer" }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {schedules.length === 0 && (
                            <tr><td colSpan={6} style={{ padding: "var(--spacing-4)", textAlign: "center", color: "var(--color-text-secondary)" }}>No schedules found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <ScheduleModal
                    onClose={() => setModalOpen(false)}
                    schedule={editingSchedule}
                    menuItems={items}
                />
            )}
        </div>
    );
}

function ScheduleModal({ onClose, schedule, menuItems }: { onClose: () => void, schedule: MenuSchedule | null, menuItems: any[] }) {
    const [name, setName] = useState(schedule?.name || "");
    const [startTime, setStartTime] = useState(schedule?.startTime || "09:00");
    const [endTime, setEndTime] = useState(schedule?.endTime || "14:00");
    const [daysOfWeek, setDaysOfWeek] = useState<number[]>(schedule?.daysOfWeek || []);
    const [selectedItems, setSelectedItems] = useState<string[]>(schedule?.menuItemIds || []);
    const [isActive, setIsActive] = useState(schedule ? schedule.isActive : true);

    const toggleDay = (dayIndex: number) => {
        setDaysOfWeek(prev =>
            prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
        );
    };

    const toggleItem = (itemId: string) => {
        setSelectedItems(prev =>
            prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
        );
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (daysOfWeek.length === 0) return alert("Select at least one day of the week");

        const data = {
            name,
            startTime,
            endTime,
            daysOfWeek,
            menuItemIds: selectedItems,
            isActive
        };

        if (!db) return alert("Missing database connection.");
        if (schedule?.id) {
            await updateDoc(doc(db, "menuSchedules", schedule.id), data);
        } else {
            await addDoc(collection(db, "menuSchedules"), data);
        }
        onClose();
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "var(--spacing-4)" }}>
            <div className="glass-panel flex flex-col" style={{ padding: "var(--spacing-6)", width: "100%", maxWidth: "600px", maxHeight: "90vh" }}>
                <div className="flex justify-between items-center" style={{ marginBottom: "var(--spacing-4)" }}>
                    <h2 className="text-xl font-bold">{schedule ? "Edit Schedule" : "New Schedule"}</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-text-primary)", cursor: "pointer" }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-4 overflow-y-auto" style={{ paddingRight: "var(--spacing-2)" }}>
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Schedule Name</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)}
                            className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)" }} />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                            <label className="text-sm font-medium">Start Time</label>
                            <input type="time" required value={startTime} onChange={e => setStartTime(e.target.value)}
                                className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)" }} />
                        </div>
                        <div className="flex flex-col gap-2" style={{ flex: 1 }}>
                            <label className="text-sm font-medium">End Time</label>
                            <input type="time" required value={endTime} onChange={e => setEndTime(e.target.value)}
                                className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)" }} />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Days of Week</label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map((day, index) => (
                                <button
                                    key={index}
                                    type="button"
                                    onClick={() => toggleDay(index)}
                                    style={{
                                        padding: "var(--spacing-2) var(--spacing-3)",
                                        borderRadius: "var(--radius-md)",
                                        border: "1px solid",
                                        borderColor: daysOfWeek.includes(index) ? "var(--color-primary)" : "var(--color-overlay-hover)",
                                        background: daysOfWeek.includes(index) ? "var(--color-primary)" : "transparent",
                                        color: "var(--color-text-primary)",
                                        cursor: "pointer",
                                        fontSize: "0.875rem"
                                    }}
                                >
                                    {day.substring(0, 3)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2" style={{ marginTop: "var(--spacing-2)" }}>
                        <label className="text-sm font-medium">Included Menu Items</label>
                        <div className="glass-panel" style={{ padding: "var(--spacing-2)", maxHeight: "200px", overflowY: "auto", background: "rgba(0,0,0,0.2)" }}>
                            {menuItems.filter(item => item.isActive).map(item => (
                                <label key={item.id} className="flex items-center gap-3" style={{ padding: "var(--spacing-2)", borderBottom: "1px solid var(--color-icon-bg)", cursor: "pointer" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedItems.includes(item.id)}
                                        onChange={() => toggleItem(item.id)}
                                    />
                                    <span>{item.name} <span className="text-secondary text-sm">(${item.price})</span></span>
                                </label>
                            ))}
                            {menuItems.length === 0 && <p className="text-secondary p-2">No active items found.</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-2" style={{ marginTop: "var(--spacing-2)" }}>
                        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} id="sched-active" />
                        <label htmlFor="sched-active" className="text-sm">Active</label>
                    </div>

                    <button type="submit" style={{ padding: "var(--spacing-3)", background: "var(--color-primary)", color: "var(--color-text-primary)", border: "none", borderRadius: "var(--radius-md)", fontWeight: "bold", cursor: "pointer", marginTop: "var(--spacing-4)" }}>
                        Save Schedule
                    </button>
                </form>
            </div>
        </div>
    );
}

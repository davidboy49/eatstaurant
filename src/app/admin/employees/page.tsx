"use client";

import { useState, useEffect } from "react";
import { collection, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit, Trash2, X, ShieldAlert } from "lucide-react";

export default function EmployeesManagement() {
    const [employees, setEmployees] = useState<any[]>([]);
    const [isModalOpen, setModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<any>(null);

    useEffect(() => {
        const unsub = onSnapshot(collection(db, "employees"), (snapshot) => {
            setEmployees(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        });
        return () => unsub();
    }, []);

    return (
        <div className="flex flex-col gap-6" style={{ height: "100%" }}>
            <header className="flex items-center justify-between" style={{ marginBottom: "var(--spacing-4)" }}>
                <div>
                    <h1 className="text-2xl font-bold">Employee Management</h1>
                    <p className="text-secondary">Manage staff access and roles (Admin, Manager, Cashier, Kitchen).</p>
                </div>
                <button
                    className="flex items-center gap-2"
                    onClick={() => {
                        setEditingEmployee(null);
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
                    <Plus size={16} /> Add Employee Record
                </button>
            </header>

            <div className="glass-panel" style={{ padding: "var(--spacing-6)", marginBottom: "var(--spacing-4)" }}>
                <div className="flex items-start gap-4 text-warning" style={{ color: "var(--color-warning)" }}>
                    <ShieldAlert size={24} />
                    <div>
                        <h3 className="font-bold">Important Note on Authentication</h3>
                        <p className="text-sm mt-1" style={{ color: "var(--color-text-secondary)" }}>
                            Adding an employee record here assigns their role in the system. However, they must still create an account (or be invited) via Firebase Authentication using the exact same email address to actually log in.
                        </p>
                    </div>
                </div>
            </div>

            <div className="glass-panel" style={{ flex: 1, padding: "var(--spacing-4)", overflowY: "auto" }}>
                <table style={{ width: "100%", textAlign: "left", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ borderBottom: "1px solid var(--color-overlay)", color: "var(--color-text-secondary)" }}>
                            <th style={{ padding: "var(--spacing-3)" }}>Name</th>
                            <th style={{ padding: "var(--spacing-3)" }}>Email / UID</th>
                            <th style={{ padding: "var(--spacing-3)" }}>Role</th>
                            <th style={{ padding: "var(--spacing-3)" }}>Status</th>
                            <th style={{ padding: "var(--spacing-3)", textAlign: "right" }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map(emp => (
                            <tr key={emp.id} style={{ borderBottom: "1px solid var(--color-icon-bg)" }}>
                                <td style={{ padding: "var(--spacing-3)" }} className="font-medium">{emp.name || "Unknown"}</td>
                                <td style={{ padding: "var(--spacing-3)" }}>
                                    <div className="text-sm">{emp.email}</div>
                                    <div className="text-xs text-secondary font-mono">{emp.id}</div>
                                </td>
                                <td style={{ padding: "var(--spacing-3)" }}>
                                    <span style={{
                                        padding: "4px 8px",
                                        borderRadius: "4px",
                                        background: "var(--color-overlay)",
                                        fontSize: "0.75rem",
                                        fontWeight: "bold",
                                        textTransform: "uppercase"
                                    }}>
                                        {emp.role}
                                    </span>
                                </td>
                                <td style={{ padding: "var(--spacing-3)" }}>
                                    <span style={{
                                        color: emp.isActive ? "var(--color-success)" : "var(--color-danger)",
                                        fontSize: "0.875rem",
                                        fontWeight: "bold"
                                    }}>
                                        {emp.isActive ? "Active" : "Disabled"}
                                    </span>
                                </td>
                                <td style={{ padding: "var(--spacing-3)", textAlign: "right" }}>
                                    <button
                                        onClick={() => { setEditingEmployee(emp); setModalOpen(true); }}
                                        style={{ background: "none", border: "none", color: "var(--color-text-secondary)", cursor: "pointer", padding: "4px" }}
                                    >
                                        <Edit size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {employees.length === 0 && (
                            <tr><td colSpan={5} style={{ padding: "var(--spacing-4)", textAlign: "center", color: "var(--color-text-secondary)" }}>No employees found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <EmployeeModal onClose={() => setModalOpen(false)} employee={editingEmployee} />
            )}
        </div>
    );
}

function EmployeeModal({ onClose, employee }: { onClose: () => void, employee: any }) {
    const [uid, setUid] = useState(employee?.id || "");
    const [name, setName] = useState(employee?.name || "");
    const [email, setEmail] = useState(employee?.email || "");
    const [role, setRole] = useState(employee?.role || "cashier");
    const [isActive, setIsActive] = useState(employee ? employee.isActive : true);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = { name, email, role, isActive };

        // UI hack to use email or a custom string as the doc ID so we can match it to Auth
        // In a real app with Firebase Admin SDK, we would create the Auth user and get the real UID here.
        const docId = employee?.id || uid || email.replace(/[^a-zA-Z0-9]/g, "");

        await setDoc(doc(db, "employees", docId), data, { merge: true });
        onClose();
    };

    return (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: "var(--spacing-4)" }}>
            <div className="glass-panel flex flex-col" style={{ padding: "var(--spacing-6)", width: "100%", maxWidth: "450px" }}>
                <div className="flex justify-between items-center" style={{ marginBottom: "var(--spacing-4)" }}>
                    <h2 className="text-xl font-bold">{employee ? "Edit Employee" : "New Employee"}</h2>
                    <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--color-text-primary)", cursor: "pointer" }}><X size={20} /></button>
                </div>

                <form onSubmit={handleSave} className="flex flex-col gap-4">
                    {!employee && (
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Auth UID (Important)</label>
                            <input type="text" value={uid} onChange={e => setUid(e.target.value)} placeholder="Firebase Auth UID"
                                className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)" }} />
                            <span className="text-xs text-secondary">Must match their login UID. If unknown, we'll try to use their email safely.</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Full Name</label>
                        <input type="text" required value={name} onChange={e => setName(e.target.value)}
                            className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)" }} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                            className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)" }} />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Role</label>
                        <select required value={role} onChange={e => setRole(e.target.value)}
                            className="glass-panel" style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)", border: "1px solid var(--color-overlay)", color: "var(--color-text-primary)" }}>
                            <option value="admin" style={{ color: "black" }}>Admin</option>
                            <option value="manager" style={{ color: "black" }}>Manager</option>
                            <option value="kitchen" style={{ color: "black" }}>Kitchen</option>
                            <option value="cashier" style={{ color: "black" }}>Cashier</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2" style={{ marginTop: "var(--spacing-2)" }}>
                        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} id="emp-active" />
                        <label htmlFor="emp-active" className="text-sm">Account Active</label>
                    </div>

                    <button type="submit" style={{ padding: "var(--spacing-3)", background: "var(--color-primary)", color: "var(--color-text-primary)", border: "none", borderRadius: "var(--radius-md)", fontWeight: "bold", cursor: "pointer", marginTop: "var(--spacing-4)" }}>
                        Save Employee
                    </button>
                </form>
            </div>
        </div>
    );
}

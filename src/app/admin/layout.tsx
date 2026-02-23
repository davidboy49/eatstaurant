"use client";

import Sidebar from "@/components/Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex" style={{ minHeight: "100vh" }}>
            <Sidebar />

            <main style={{ flex: 1, padding: "var(--spacing-4) var(--spacing-6)", overflowY: "auto" }}>
                {children}
            </main>
        </div>
    );
}

"use client";

import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/components/ThemeProvider";
import {
    BarChart3,
    LayoutDashboard,
    UtensilsCrossed,
    Settings,
    Clock,
    Users,
    LogOut,
    Sun,
    Moon
} from "lucide-react";
import { usePathname } from "next/navigation";

export default function Sidebar() {
    const { user, role, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const pathname = usePathname();

    if (!user) return null;

    return (
        <aside className="glass-panel" style={{ width: "260px", margin: "var(--spacing-4)", padding: "var(--spacing-4)", display: "flex", flexDirection: "column" }}>
            <div className="flex items-center gap-2" style={{ marginBottom: "var(--spacing-8)", padding: "var(--spacing-2)" }}>
                <UtensilsCrossed size={24} className="text-primary-color" />
                <h2 className="text-xl font-bold">Eatstaurant</h2>
            </div>

            <nav className="flex flex-col gap-2">
                <NavLink href="/" icon={<LayoutDashboard size={20} />} label="Dashboard" active={pathname === "/"} />
                <NavLink href="/pos" icon={<UtensilsCrossed size={20} />} label="POS Terminal" active={pathname.startsWith("/pos")} />
                <NavLink href="/kitchen" icon={<Clock size={20} />} label="Kitchen" active={pathname.startsWith("/kitchen")} />
                {role === "admin" && (
                    <>
                        <div style={{ margin: "var(--spacing-4) 0 var(--spacing-2)", padding: "0 var(--spacing-2)" }}>
                            <span className="text-xs font-bold text-secondary uppercase tracking-wider">Administration</span>
                        </div>
                        <NavLink href="/admin/menu" icon={<BarChart3 size={20} />} label="Menu Management" active={pathname.startsWith("/admin/menu")} />
                        <NavLink href="/admin/employees" icon={<Users size={20} />} label="Employees" active={pathname.startsWith("/admin/employees")} />
                        <NavLink href="/admin/settings" icon={<Settings size={20} />} label="Settings" active={pathname.startsWith("/admin/settings")} />
                    </>
                )}
            </nav>

            <div style={{ marginTop: "auto", padding: "var(--spacing-2)" }}>
                <button
                    onClick={toggleTheme}
                    className="flex items-center gap-2 text-sm text-secondary font-medium w-full"
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "var(--spacing-2)",
                        textAlign: "left",
                        marginBottom: "var(--spacing-4)"
                    }}
                >
                    {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                    {theme === 'dark' ? "Light Mode" : "Dark Mode"}
                </button>
                <div className="flex items-center gap-3" style={{ marginBottom: "var(--spacing-4)" }}>
                    <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "var(--color-primary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        color: "var(--color-text-primary)"
                    }}>
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium">{user.email?.split('@')[0]}</span>
                        <span className="text-sm text-secondary" style={{ fontSize: "0.75rem" }}>{role || "No Role"}</span>
                    </div>
                </div>
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-2 text-sm text-secondary font-medium w-full"
                    style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "var(--spacing-2)",
                        textAlign: "left"
                    }}
                >
                    <LogOut size={16} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}

function NavLink({ href, icon, label, active = false }: { href: string, icon: React.ReactNode, label: string, active?: boolean }) {
    return (
        <a
            href={href}
            className="flex items-center gap-3 font-medium transition-colors"
            style={{
                padding: "var(--spacing-3)",
                borderRadius: "var(--radius-md)",
                background: active ? "var(--color-overlay)" : "transparent",
                color: active ? "var(--color-primary)" : "var(--color-text-secondary)",
                textDecoration: "none"
            }}
        >
            {icon}
            <span>{label}</span>
            {active && (
                <div style={{
                    marginLeft: "auto",
                    width: "4px",
                    height: "16px",
                    background: "var(--color-primary)",
                    borderRadius: "var(--radius-full)"
                }} />
            )}
        </a>
    );
}

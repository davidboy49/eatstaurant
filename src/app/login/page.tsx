"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/");
        } catch (err: any) {
            console.error(err);
            setError("Invalid email or password");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-vh-100" style={{ minHeight: "100vh" }}>
            <div className="glass-panel" style={{ padding: "var(--spacing-8)", width: "100%", maxWidth: "400px" }}>
                <h1 className="text-2xl font-bold" style={{ marginBottom: "var(--spacing-2)" }}>Eatstaurant</h1>
                <p className="text-secondary" style={{ marginBottom: "var(--spacing-6)" }}>Please sign in to continue</p>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="glass-panel"
                            style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)" }}
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="glass-panel"
                            style={{ padding: "var(--spacing-3)", background: "var(--color-icon-bg)" }}
                            required
                        />
                    </div>

                    {error && <p className="text-sm" style={{ color: "var(--color-danger)" }}>{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="font-bold"
                        style={{
                            marginTop: "var(--spacing-4)",
                            padding: "var(--spacing-3)",
                            backgroundColor: "var(--color-primary)",
                            color: "var(--color-text-primary)",
                            border: "none",
                            borderRadius: "var(--radius-md)",
                            cursor: loading ? "not-allowed" : "pointer"
                        }}
                    >
                        {loading ? "Signing in..." : "Login"}
                    </button>
                </form>
            </div>
        </div>
    );
}

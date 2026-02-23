"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { onAuthStateChanged, signOut, User, type Auth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    role: string | null;
    loading: boolean;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    role: null,
    loading: true,
    logout: async () => { },
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const authRef = useRef<Auth | null>(null);

    useEffect(() => {
        let unsubscribe: (() => void) | undefined;

        const initAuth = async () => {
            try {
                const { auth, db } = await import("./firebase");
                authRef.current = auth;

                unsubscribe = onAuthStateChanged(auth, async (user) => {
                    setUser(user);

                    if (user) {
                        try {
                            const userDoc = await getDoc(doc(db, "employees", user.uid));
                            if (userDoc.exists()) {
                                setRole(userDoc.data().role);
                            } else {
                                console.warn("User document not found in Firestore");
                                setRole(null);
                            }
                        } catch (error) {
                            console.error("Error fetching user role:", error);
                            setRole(null);
                        }
                    } else {
                        setRole(null);
                    }

                    setLoading(false);
                });
            } catch (error) {
                console.error("Failed to initialize Firebase auth context:", error);
                setLoading(false);
            }
        };

        initAuth();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, []);

    const logout = async () => {
        if (authRef.current) {
            await signOut(authRef.current);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, loading, logout }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);

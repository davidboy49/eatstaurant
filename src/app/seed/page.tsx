"use client";

import { useEffect, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { db, auth } from "@/lib/firebase";

export default function SeedPage() {
    const [status, setStatus] = useState("Initializing...");

    useEffect(() => {
        const seed = async () => {
            let uid = "";
            try {
                setStatus("Creating Auth user...");
                try {
                    // Attempt to create the user
                    const userCredential = await createUserWithEmailAndPassword(auth, "admin@eatstaurant.com", "admin123");
                    uid = userCredential.user.uid;
                } catch (authError: any) {
                    if (authError.code !== 'auth/email-already-in-use') {
                        throw authError;
                    }
                    console.log("Auth user already exists, proceeding to Login to grab UID.");
                    // If they already exist, we need to sign in to get their UID before seeding Firestore
                    const userCredential = await import("firebase/auth").then(m => m.signInWithEmailAndPassword(auth, "admin@eatstaurant.com", "admin123"));
                    uid = userCredential.user.uid;
                }

                if (!uid) throw new Error("Failed to secure a User ID");

                setStatus("Seeding admin user document...");
                await setDoc(doc(db, "employees", uid), {
                    email: "admin@eatstaurant.com",
                    role: "admin",
                    name: "System Admin",
                    isActive: true
                });

                setStatus("Seed successful! You can now login with admin@eatstaurant.com and password: 'admin123'.");
            } catch (error: any) {
                console.error(error);
                setStatus("Seed failed: " + error.message);
            }
        };

        seed();
    }, []);

    return (
        <div style={{ padding: "40px", fontFamily: "sans-serif" }}>
            <h1>Database Seeder</h1>
            <p>{status}</p>
            <a href="/login" style={{ color: "var(--color-primary)" }}>Go to Login</a>
        </div>
    );
}

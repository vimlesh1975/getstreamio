"use client";

import { useState } from "react";

export default function TokenGenerator({
    defaultUserId = "",
    onTokenGenerated,
}) {
    const [userId, setUserId] = useState(defaultUserId);
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function generateToken() {
        if (!userId) return;

        setLoading(true);
        setError("");
        setToken("");

        try {
            const res = await fetch("/api/token", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");

            setToken(data.token);
            onTokenGenerated?.(data.token, userId);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div
            style={{
                padding: 16,
                border: "1px solid #333",
                borderRadius: 8,
                background: "#111",
                color: "white",
                maxWidth: 420,
            }}
        >
            <h3 style={{ marginTop: 0 }}>Generate Caller Token</h3>

            <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="caller-1"
                style={{
                    width: "100%",
                    padding: 10,
                    marginBottom: 8,
                }}
            />

            <button
                type="button"   // 👈 IMPORTANT
                onClick={generateToken}
                disabled={loading || !userId}
            >
                {loading ? "Generating…" : "Generate Token"}
            </button>


            {error && (
                <div style={{ color: "red", marginTop: 8 }}>
                    {error}
                </div>
            )}

            {token && (
                <>
                    <div style={{ marginTop: 8, fontSize: 12 }}>
                        Token:
                    </div>
                    <textarea
                        value={token}
                        readOnly
                        rows={4}
                        style={{ width: "100%" }}
                    />
                </>
            )}
        </div>
    );
}

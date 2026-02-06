"use client";

import { useState, useEffect, useMemo } from "react";

export default function TokenGeneratorWithDuration({
    defaultUserId = "",
}) {
    const [userId, setUserId] = useState(defaultUserId);
    const [duration, setDuration] = useState(10); // minutes
    const [token, setToken] = useState("");
    const [expiresAt, setExpiresAt] = useState(null);
    const [baseUrl, setBaseUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        setBaseUrl(window.location.origin);
    }, []);

    async function generateToken() {
        if (!userId) return;

        setLoading(true);
        setError("");
        setToken("");

        try {
            const res = await fetch("/api/token-with-duration", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    durationMinutes: duration,
                }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed");

            setToken(data.token);
            setExpiresAt(data.expiresAt);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    const callerUrl = useMemo(() => {
        if (!token || !baseUrl) return "";
        return `${baseUrl}/caller-with-token?token=${encodeURIComponent(token)}`;
    }, [token, baseUrl]);

    function copyUrl() {
        navigator.clipboard.writeText(callerUrl);
    }

    return (
        <div
            style={{
                padding: 16,
                border: "1px solid #333",
                borderRadius: 8,
                background: "#111",
                color: "white",
                maxWidth: 440,
            }}
        >
            <h3 style={{ marginTop: 0 }}>
                Generate Caller Token
            </h3>

            {/* USER ID */}
            <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="caller-1"
                style={{ width: "80%", padding: 10, marginBottom: 8 }}
            />

            {/* DURATION */}

            <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                style={{
                    width: "80%",
                    padding: 8,
                    marginBottom: 12,
                }}
            >
                <option value={1}>1 minutes</option>
                <option value={5}>5 minutes</option>
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
            </select>

            <button
                type="button"
                onClick={generateToken}
                disabled={loading || !userId}
                style={{ marginBottom: 12 }}
            >
                {loading ? "Generating…" : "Generate Token"}
            </button>

            {error && (
                <div style={{ color: "red", marginBottom: 8 }}>
                    {error}
                </div>
            )}

            {token && (
                <>
                    {/* CALLER URL */}
                    <div style={{ fontSize: 12, marginBottom: 4 }}>
                        Caller URL
                    </div>
                    <input
                        value={callerUrl}
                        readOnly
                        style={{
                            width: "80%",
                            padding: 8,
                            marginBottom: 8,
                        }}
                    />

                    <button
                        type="button"
                        onClick={copyUrl}
                        style={{ marginBottom: 8 }}
                    >
                        Copy URL
                    </button>

                    {expiresAt && (
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                            Expires at:{" "}
                            {new Date(expiresAt * 1000).toLocaleString()}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

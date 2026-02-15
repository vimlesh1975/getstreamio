"use client";

import { useState, useEffect, useMemo } from "react";

export default function TokenGeneratorWithDuration({
    defaultUserId = "",
    roomid = "room-1" // 👈 1. Added roomid prop
}) {
    const [userId, setUserId] = useState(defaultUserId);
    const [duration, setDuration] = useState(10);
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

    // 👈 2. Updated to include the dynamic room path
    const callerUrl = useMemo(() => {
        if (!token || !baseUrl) return "";
        // Sends them to /caller/[roomid] with the token as a query param
        return `${baseUrl}/caller/${roomid}?token=${encodeURIComponent(token)}`;
    }, [token, baseUrl, roomid]);

    function copyUrl() {
        navigator.clipboard.writeText(callerUrl);
    }

    return (
        <div
            style={{
                padding: 16,
                border: "1px solid #333",
                borderRadius: 8,
                background: "#817f7f",
                color: "white",
                maxWidth: 440,
            }}
        >
            <h3 style={{ marginTop: 0 }}>
                Generate Token for {roomid.replace(/_/g, " ")}
            </h3>

            <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="caller-name"
                style={{ width: "80%", padding: 10, marginBottom: 8, color: 'black' }}
            />

            <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                style={{
                    width: "80%",
                    padding: 8,
                    marginBottom: 12,
                    color: 'black'
                }}
            >
                <option value={0.16}>10 seconds</option>
                <option value={1}>1 minute</option>
                <option value={10}>10 minutes</option>
                <option value={60}>1 hour</option>
                <option value={300}>5 hours</option>
            </select>

            <button
                type="button"
                onClick={generateToken}
                disabled={loading || !userId}
                style={{ marginBottom: 12, display: 'block' }}
            >
                {loading ? "Generating…" : "Generate Invite Link"}
            </button>

            {error && (
                <div style={{ color: "#fee2e2", marginBottom: 8, fontSize: '0.8rem' }}>
                    {error}
                </div>
            )}

            {token && (
                <>
                    <div style={{ fontSize: 12, marginBottom: 4 }}>
                        Guest Invite URL
                    </div>
                    <input
                        value={callerUrl}
                        readOnly
                        style={{
                            width: "80%",
                            padding: 8,
                            marginBottom: 8,
                            background: '#333',
                            color: '#ccc',
                            border: '1px solid #555'
                        }}
                    />

                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={copyUrl}>Copy URL</button>
                        <button type="button" onClick={() => window.open(callerUrl, "_blank")}>Test URL</button>
                    </div>

                    {expiresAt && (
                        <div style={{ fontSize: 11, marginTop: 10, opacity: 0.8 }}>
                            Link expires: {new Date(expiresAt * 1000).toLocaleTimeString()}
                        </div>
                    )}
                </>
            )}

            <style jsx>{`
                button {
                    padding: 8px 12px;
                    border-radius: 4px;
                    border: 1px solid #ccc;
                    background: white;
                    cursor: pointer;
                }
                button:hover {
                    background-color: #000000 !important;
                    color: #ffffff !important;
                    transition: all 0.2s ease;
                }
            `}</style>
        </div>
    );
}
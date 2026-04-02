"use client";

import { useState, useEffect, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

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
                    userId: userId.trim().toUpperCase().replace(/\s+/g, '_'),
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
        return `${baseUrl}/caller-with-token/${roomid}?token=${encodeURIComponent(token)}`;
    }, [token, baseUrl, roomid]);

    function copyUrl() {
        navigator.clipboard.writeText(callerUrl);
    }

    return (
        // <div
        //     style={{
        //         padding: 16,
        //         border: "1px solid #333",
        //         borderRadius: 8,
        //         background: "#817f7f",
        //         color: "white",
        //         maxWidth: 440,
        //     }}
        // >
        // Change the main container div's style prop:
        <div
            style={{
                padding: 16,
                border: "1px solid #333",
                borderRadius: 8,
                background: "#817f7f",
                color: "white",
                maxWidth: 440,
                // --- ADD THESE ---
                position: "absolute",
                zIndex: 100,
                boxShadow: "0px 4px 12px rgba(0,0,0,0.5)"
            }}
        >
            <h3 style={{ marginTop: 0 }}>
                Generate Token for {roomid.replace(/_/g, " ")}
            </h3>

            UserId  <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="caller-name"
                style={{ width: "80%", padding: 10, marginBottom: 8, color: 'black', marginLeft: 16 }}
            />

            Duration <select
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
                <option value={120}>2 hour</option>
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
                    {expiresAt && (
                        <div style={{ fontSize: 11, marginTop: 10, opacity: 0.8 }}>
                            Link expires: {new Date(expiresAt * 1000).toLocaleTimeString()}
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <button type="button" onClick={copyUrl}>Copy URL</button>
                        <button type="button" onClick={() => {
                            //  window.open(callerUrl, "_blank");

                            const features = "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes";

                            window.open(callerUrl, "GuestWindow", features);

                        }}>Test URL</button>
                    </div>

                    <div style={{ background: 'white', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
                        <QRCodeSVG
                            value={callerUrl}
                            size={160}
                            level={"H"} // High error correction
                            includeMargin={false}
                        />
                    </div>
                    <button className="download-btn" onClick={() => window.open("https://drive.google.com/drive/folders/1_ThcoK7xsQt67BeES4K8iBBipiRxoyec", "_blank")}>
                        download Casparcg Server
                    </button>

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
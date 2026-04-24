"use client";

import { useState, useEffect, useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function TokenGeneratorWithDuration({
    defaultUserId = "",
    roomid = "room-1"
}) {
    const [userId, setUserId] = useState(defaultUserId);
    const [duration, setDuration] = useState(10);
    const [token, setToken] = useState("");
    const [expiresAt, setExpiresAt] = useState(null);
    const [baseUrl, setBaseUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("917738187885");

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
                    userId: userId.trim().toUpperCase().replace(/\s+/g, "_"),
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

        setUserId(`${roomid}-${Date.now()}`)
    }

    const callerUrl = useMemo(() => {
        if (!token || !baseUrl) return "";
        return `${baseUrl}/caller-with-token/${roomid}?token=${encodeURIComponent(token)}`;
    }, [token, baseUrl, roomid]);

    function copyUrl() {
        navigator.clipboard.writeText(callerUrl);
    }

    function sendWhatsApp() {
        if (!callerUrl) return;

        const cleanPhone = phoneNumber.replace(/\D/g, "");
        const messageText = `Hello, here is your invite link. Plase Allow Microphone & Camera, Put mobile horizontal and auto rotate ON : ${callerUrl}`;
        const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(messageText)}`;

        window.open(waUrl, "WhatsAppTab");
    }

    return (
        <div>
            <h3 style={{ marginTop: 0 }}>
                Generate Invite Link for {roomid.replace(/_/g, " ")}
            </h3>

            <div className="generator-toolbar">
                <label className="field field-user">
                    <span>UserId</span>
                    <input
                        value={userId}
                        onChange={(e) => setUserId(e.target.value)}
                        placeholder="caller-name"
                    />
                </label>

                <label className="field field-small">
                    <span>Duration</span>
                    <select
                        value={duration}
                        onChange={(e) => setDuration(Number(e.target.value))}
                    >
                        <option value={0.16}>10 seconds</option>
                        <option value={1}>1 minute</option>
                        <option value={10}>10 minutes</option>
                        <option value={60}>1 hour</option>
                        <option value={120}>2 hour</option>
                        <option value={300}>5 hours</option>
                    </select>
                </label>

                <button
                    type="button"
                    onClick={generateToken}
                    disabled={loading || !userId}
                    className="generate-btn"
                >
                    {loading ? "Generating" : "Generate"}
                </button>
            </div>

            {error && (
                <div style={{ color: "#fee2e2", marginBottom: 8, fontSize: "0.8rem" }}>
                    {error}
                </div>
            )}

            {token && (
                <>
                    <div className="url-row">
                        <div className="url-label">Guest Invite URL</div>
                        <input
                            value={callerUrl}
                            readOnly
                            className="url-input"
                            style={{
                                background: "#333",
                                color: "#ccc",
                                border: "1px solid #555"
                            }}
                        />
                    </div>
                    <div className="action-row">
                        <button type="button" onClick={copyUrl}>Copy URL</button>
                        <label className="field field-phone">
                            <input
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                placeholder="Phone with country code"
                            />
                        </label>
                        <button
                            type="button"
                            onClick={sendWhatsApp}
                            style={{ backgroundColor: "#25D366", color: "white", border: "none" }}
                        >
                            WhatsApp
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                const features = "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes";
                                window.open(callerUrl, "GuestWindow_" + Date.now(), features);
                            }}
                        >
                            Test URL
                        </button>
                    </div>

                    <div style={{ background: "white", padding: "10px", borderRadius: "4px", marginBottom: "10px", marginTop: "10px", width: "fit-content" }}>
                        <QRCodeSVG
                            value={callerUrl}
                            size={160}
                            level={"H"}
                            includeMargin={false}
                        />
                    </div>
                    <button className="download-btn" onClick={() => window.open("https://drive.google.com/drive/folders/1_ThcoK7xsQt67BeES4K8iBBipiRxoyec", "_blank")}>
                        download Casparcg Server
                    </button>
                </>
            )}

            <style jsx>{`
                .generator-toolbar,
                .action-row {
                    display: flex;
                    gap: 12px;
                    align-items: end;
                    margin-bottom: 12px;
                }
                .url-row {
                    display: flex;
                    gap: 10px;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .url-label {
                    font-size: 12px;
                    white-space: nowrap;
                }
                .generator-toolbar {
                    gap: 6px;
                    flex-wrap: nowrap;
                }
                .action-row {
                    gap: 4px;
                    flex-wrap: nowrap;
                    overflow-x: auto;
                }
                .field {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                    min-width: 170px;
                }
                .field-user {
                    flex: 0 0 170px;
                    min-width: 170px;
                    max-width: 170px;
                }
                .field-small {
                    flex: 0 0 100px;
                    min-width: 100px;
                    max-width: 100px;
                }
                .field-phone {
                    flex: 0 0 130px;
                    min-width: 130px;
                    max-width: 130px;
                }
                input,
                select {
                    width: 100%;
                    height: 36px;
                    padding: 6px 10px;
                    color: black;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                    box-sizing: border-box;
                }
                .url-input {
                    flex: 1 1 auto;
                    margin-bottom: 0;
                }
                .generate-btn {
                    align-self: end;
                    white-space: nowrap;
                    margin-bottom: 0;
                    height: 36px;
                    padding: 6px 10px;
                    font-size: 14px;
                    flex: 0 0 auto;
                }
                button {
                    height: 36px;
                    padding: 7px 8px;
                    border-radius: 4px;
                    border: 1px solid #ccc;
                    background: white;
                    cursor: pointer;
                    color: black;
                    font-size: 13px;
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

"use client";

import { useEffect, useState } from "react";
import {
    StreamVideo,
    StreamCall,
    ParticipantView,
    useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { StreamVideoClient } from "@stream-io/video-client";
import { useSearchParams } from "next/navigation";

export default function CallerWithToken() {
    const params = useSearchParams();
    const token = params.get("token");

    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [joined, setJoined] = useState(false);
    const [error, setError] = useState("");

    // 🔐 Validate token & setup Stream client
    useEffect(() => {
        if (!token) {
            setError("❌ Missing invite token.");
            return;
        }

        try {
            // Decode JWT payload (NOT validation – Stream validates later)
            const payload = JSON.parse(atob(token.split(".")[1]));
            const now = Math.floor(Date.now() / 1000);

            // ⏰ Expiry check BEFORE connecting
            if (payload.exp < now) {
                setError("⏰ This invite link has expired.");
                return;
            }

            const userId = payload.user_id;

            const client = new StreamVideoClient({
                apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY,
                user: { id: userId },
                token,
            });

            const call = client.call("default", "room-1");

            setClient(client);
            setCall(call);
        } catch (e) {
            console.error(e);
            setError("❌ Invalid invite link.");
        }
    }, [token]);

    // 🚫 FULL-SCREEN ERROR UI
    if (error) {
        return (
            <div
                style={{
                    background: "#0f0f0f",
                    color: "white",
                    height: "100vh",
                    display: "grid",
                    placeItems: "center",
                    textAlign: "center",
                    padding: 30,
                    fontFamily: "sans-serif",
                }}
            >
                <div>
                    <div style={{ fontSize: 60 }}>🚫</div>
                    <h2>{error}</h2>
                    <p style={{ color: "#888", marginTop: 10 }}>
                        Please contact the host for a new link.
                    </p>
                </div>
            </div>
        );
    }

    if (!client || !call) {
        return (
            <div
                style={{
                    background: "#111",
                    height: "100vh",
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                }}
            >
                Validating invite…
            </div>
        );
    }

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <CallerInner
                    call={call}
                    joined={joined}
                    setJoined={setJoined}
                    setError={setError}
                />
            </StreamCall>
        </StreamVideo>
    );
}

/* ------------------------------------------------ */
/* ---------------- CALLER UI --------------------- */
/* ------------------------------------------------ */

function CallerInner({ call, joined, setJoined, setError }) {
    const {
        useParticipants,
        useLocalParticipant,
        useMicrophoneState,
        useCameraState,
    } = useCallStateHooks();

    const participants = useParticipants();
    const self = useLocalParticipant();
    const host = participants.find((p) => p.userId === "host");

    // Get Mute States
    const { microphone, isMute } = useMicrophoneState();
    const CameraState = useCameraState();
    const localAudioLevel = self?.audioLevel || 0;

    // 🎯 JOIN CALL WITH ERROR HANDLING
    async function startCall() {
        try {
            await call.join({
                create: true,
                video: true,
                audio: true,
            });

            setJoined(true);
        } catch (err) {
            console.error("Join failed:", err);

            if (
                err?.message?.includes("token is expired") ||
                err?.code === 40
            ) {
                setError("⏰ This invite link has expired.");
            } else {
                setError("❌ Invalid or unauthorized invite link.");
            }
        }
    }

    // -------- SETUP SCREEN --------
    if (!joined) {
        return (
            <div
                style={{
                    background: "#1a1a1a",
                    minHeight: "100vh",
                    color: "white",
                    display: "grid",
                    placeItems: "center",
                    fontFamily: "sans-serif",
                }}
            >
                <div style={{ textAlign: "center" }}>
                    <h2>📷 Media Setup</h2>
                    <p style={{ color: "#aaa" }}>
                        Allow camera & microphone to continue
                    </p>

                    <button
                        onClick={startCall}
                        style={{
                            marginTop: 30,
                            padding: "14px 40px",
                            fontSize: 18,
                            borderRadius: 30,
                            border: "none",
                            background: "#0070f3",
                            color: "white",
                            cursor: "pointer",
                            fontWeight: "bold",
                        }}
                    >
                        📲 Enter Call
                    </button>
                </div>
            </div>
        );
    }

    // -------- IN-CALL UI --------
    return (
        <div
            style={{
                background: "black",
                minHeight: "100vh",
                color: "white",
                padding: 10,
            }}
        >
            <div style={{ display: "flex", gap: 10, height: "85vh" }}>
                <div style={{ flex: 1 }}>
                    <p style={{ color: "#888" }}>Host</p>
                    {host ? (
                        <ParticipantView participant={host} />
                    ) : (
                        <div style={{ color: "#444" }}>Waiting for host…</div>
                    )}
                </div>

                <div style={{ flex: 1, position: "relative" }}>
                    <p style={{ color: "#888" }}>You</p>
                    {self && <ParticipantView participant={self} muted />}

                    {/* 🎤 AUDIO LEVEL BAR */}
                    <div
                        style={{
                            position: "absolute",
                            left: 10,
                            bottom: 10,
                            width: 6,
                            height: 120,
                            background: "#222",
                            borderRadius: 4,
                        }}
                    >
                        <div
                            style={{
                                position: "absolute",
                                bottom: 0,
                                width: "100%",
                                height: `${Math.min(
                                    Math.pow(localAudioLevel, 0.4) * 100,
                                    100
                                )}%`,
                                background: isMute ? "red" : "#4caf50",
                            }}
                        />
                    </div>

                    {CameraState.camMute && (
                        <div
                            style={{
                                position: "absolute",
                                inset: 0,
                                background: "#111",
                                display: "grid",
                                placeItems: "center",
                                color: "#555",
                            }}
                        >
                            Camera Off
                        </div>
                    )}
                </div>
            </div>

            {/* CONTROLS */}
            <div
                style={{
                    display: "flex",
                    gap: 15,
                    justifyContent: "center",
                    marginTop: 10,
                }}
            >
                <button onClick={() => call.microphone.toggle()}>
                    {isMute ? "🎤 Unmute" : "🎤 Mute"}
                </button>
                <button onClick={() => call.camera.toggle()}>
                    {CameraState.isMute ? "📷 Turn On" : "📷 Stop"}
                </button>
                <button onClick={() => window.location.reload()}>
                    🚪 Leave
                </button>
            </div>
        </div>
    );
}

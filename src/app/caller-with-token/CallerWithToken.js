"use client";

import { useEffect, useState } from "react";
import {
    StreamVideo,
    StreamCall,
    ParticipantView,
    useCallStateHooks,
    StreamTheme,
    CallControls,
} from "@stream-io/video-react-sdk";
import { StreamVideoClient } from "@stream-io/video-client";
import { useSearchParams } from "next/navigation";
import "@stream-io/video-react-sdk/dist/css/styles.css";

export default function CallerWithToken() {
    const params = useSearchParams();
    const token = params.get("token");

    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [error, setError] = useState("");

    // 🔐 Validate token & setup Stream client
    useEffect(() => {
        if (!token) {
            setError("❌ Missing invite token.");
            return;
        }

        // Initialize the client inside an async function or useEffect block
        const initClient = async () => {
            try {
                // Decode JWT payload (Basic expiry check)
                // atob decodes the base64 token string
                const payload = JSON.parse(atob(token.split(".")[1]));
                const now = Math.floor(Date.now() / 1000);

                if (payload.exp < now) {
                    setError("⏰ This invite link has expired.");
                    return;
                }

                const userId = payload.user_id;
                const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

                if (!apiKey) {
                    setError("❌ Configuration error: Missing API Key");
                    return;
                }

                const newClient = new StreamVideoClient({
                    apiKey,
                    user: { id: userId },
                    token,
                });

                const newCall = newClient.call("default", "room-1");

                // Join immediately
                await newCall.join({ create: true, video: true, audio: true });

                setClient(newClient);
                setCall(newCall);
            } catch (err) {
                console.error("Join failed", err);
                setError("❌ Invalid invite link or connection failed.");
            }
        };

        initClient();

        // Cleanup function
        return () => {
            if (client) {
                client.disconnectUser();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // 🚫 FULL-SCREEN ERROR UI
    if (error) {
        return (
            <div className="error-screen">
                <div className="error-content">
                    <div style={{ fontSize: 60 }}>🚫</div>
                    <h2>{error}</h2>
                    <p>Please contact the host for a new link.</p>
                </div>
                <style jsx>{`
          .error-screen {
            background: #0f0f0f;
            color: white;
            height: 100vh;
            display: grid;
            place-items: center;
            text-align: center;
            font-family: sans-serif;
          }
          .error-content p {
            color: #888;
            margin-top: 10px;
          }
        `}</style>
            </div>
        );
    }

    // ⏳ LOADING UI
    if (!client || !call) {
        return (
            <div className="loading-screen">
                <p>Validating invite...</p>
                <style jsx>{`
          .loading-screen {
            background: #111;
            height: 100vh;
            color: white;
            display: grid;
            place-items: center;
            font-family: sans-serif;
          }
        `}</style>
            </div>
        );
    }

    // ✅ ACTIVE CALL UI
    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <StreamTheme>
                    <CallerUI />
                </StreamTheme>
            </StreamCall>
        </StreamVideo>
    );
}

/* ------------------------------------------------ */
/* ---------------- CALLER UI --------------------- */
/* ------------------------------------------------ */

function CallerUI() {
    const { useParticipants, useLocalParticipant } = useCallStateHooks();
    const participants = useParticipants();
    const localParticipant = useLocalParticipant();

    // Logic: Find the Host, or just the "other" person if I am not the host
    const host =
        participants.find((p) => p.userId === "host") ||
        participants.find((p) => p.userId !== localParticipant?.userId);

    return (
        <div className="main-container">
            <div className="video-grid">
                {/* HOST / OTHER PARTICIPANT */}
                <div className="video-tile">
                    {host ? (
                        <ParticipantView participant={host} key={host.sessionId} />
                    ) : (
                        <div className="status">Waiting for host...</div>
                    )}
                    <div className="name-badge">Host</div>
                </div>

                {/* YOUR TILE (LOCAL) */}
                <div className="video-tile">
                    {localParticipant ? (
                        <ParticipantView
                            participant={localParticipant}
                            mirror={true}
                            key={localParticipant.sessionId}
                        />
                    ) : (
                        <div className="status">Starting Camera...</div>
                    )}
                    <div className="name-badge">You</div>
                </div>
            </div>

            {/* FIXED CONTROLS OVERLAY (Floating at bottom) */}
            <div className="floating-controls">
                <CallControls onLeave={() => (window.location.href = "/")} />
            </div>

            <style jsx>{`
        .main-container {
          /* Dynamic viewport height for Mobile Address Bar fix */
          height: 100dvh;
          width: 100vw;
          background: #000;
          position: relative;
          overflow: hidden;
        }

        .video-grid {
          height: 100%;
          width: 100%;
          display: grid;
          /* LANDSCAPE: Side-by-Side */
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 8px;
          padding-bottom: 80px; /* Space for controls */
        }

        .video-tile {
          position: relative;
          background: #1a1a1a;
          border-radius: 12px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .name-badge {
          position: absolute;
          bottom: 10px;
          left: 10px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 5;
        }

        .status {
          color: #555;
          font-family: sans-serif;
        }

        /* --- FIXED CONTROLS CSS --- */
        .floating-controls {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          width: auto;
          display: flex;
          justify-content: center;
          background: rgba(0, 0, 0, 0.6);
          padding: 10px;
          border-radius: 30px;
          backdrop-filter: blur(4px);
        }

        /* MOBILE PORTRAIT: Stack vertically */
        @media (max-width: 768px) and (orientation: portrait) {
          .video-grid {
            grid-template-columns: 1fr;
            grid-template-rows: 1fr 1fr;
            padding-bottom: 100px;
          }
        }
      `}</style>
        </div>
    );
}
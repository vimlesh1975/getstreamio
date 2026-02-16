"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import {
    StreamVideo,
    StreamCall,
    ParticipantView,
    useCallStateHooks,
    StreamTheme,
    CallControls,
    StreamVideoClient
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";

export default function CallerWithTokenPage({ params }) {
    const resolvedParams = use(params);
    const roomid = resolvedParams.roomid;

    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            setError("No token found in URL");
            return;
        }

        async function init() {
            try {
                // 1. Decode the token to get the exact userId stored inside it
                // This ensures the userId matches the token signature
                const payloadBase64 = token.split('.')[1];
                const decodedPayload = JSON.parse(window.atob(payloadBase64));
                const userIdFromToken = decodedPayload.user_id;
                const expiry = decodedPayload.exp;

                // 2. Initialize the Stream Client directly with the token
                const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
                const c = new StreamVideoClient({
                    apiKey,
                    user: { id: userIdFromToken },
                    token: token,
                });

                // 3. Join the call
                const activeCall = c.call("default", roomid);
                await activeCall.join({ create: true, video: true, audio: true });

                setClient(c);
                setCall(activeCall);

                // 4. Optional: Set a timer to alert when token expires
                const remainingMs = (expiry * 1000) - Date.now();
                if (remainingMs > 0) {
                    setTimeout(() => {
                        alert("Your session has expired.");
                        window.location.reload();
                    }, remainingMs);
                }

            } catch (err) {
                console.error("Initialization failed", err);
                setError("Invalid token or connection error");
            }
        }

        init();

        return () => {
            if (call) call.leave();
        };
    }, [token, roomid]);

    if (error) return <div style={{ color: 'red', padding: '20px' }}>{error}</div>;
    if (!client || !call) return <div style={{ color: 'white', padding: '20px' }}>Joining Studio...</div>;

    return (
        <StreamVideo client={client}>
            <StreamCall call={call}>
                <StreamTheme>
                    <MeetingUI roomid={roomid} />
                </StreamTheme>
            </StreamCall>
        </StreamVideo>
    );
}

function MeetingUI({ roomid }) {
    const { useParticipants, useLocalParticipant } = useCallStateHooks();
    const participants = useParticipants();
    const localParticipant = useLocalParticipant();

    // Find the host (user starting with 'host-')
    const host = participants.find((p) => p.userId.startsWith("host-")) ||
        participants.find((p) => p.userId !== localParticipant?.userId);

    return (
        <div className="main-container">
            <div className="video-grid">
                {/* STUDIO FEED */}
                <div className="video-tile">
                    {host ? <ParticipantView participant={host} /> : <div className="status">Waiting for Studio...</div>}
                    <div className="name-badge">STUDIO ({roomid})</div>
                </div>

                {/* GUEST SELF-VIEW */}
                <div className="video-tile">
                    {localParticipant ? (
                        <ParticipantView participant={localParticipant} mirror={true} />
                    ) : (
                        <div className="status">Initializing Camera...</div>
                    )}
                    <div className="name-badge">YOU (LIVE)</div>
                </div>
            </div>

            <div className="floating-controls">
                <CallControls onLeave={() => window.location.href = "/"} />
            </div>

            <style jsx>{`
        .main-container { height: 100dvh; width: 100vw; background: #000; position: relative; overflow: hidden; }
        .video-grid { height: 100%; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px; padding-bottom: 80px; }
        .video-tile { position: relative; background: #1a1a1a; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
        .name-badge { position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; z-index: 5; }
        .status { color: #555; font-family: sans-serif; }
        .floating-controls { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 100; width: auto; display: flex; justify-content: center; background: rgba(0, 0, 0, 0.6); padding: 10px; border-radius: 30px; backdrop-filter: blur(4px); }
        @media (max-width: 768px) and (orientation: portrait) { .video-grid { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; padding-bottom: 100px; } }
      `}</style>
        </div>
    );
}
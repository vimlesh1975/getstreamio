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
    StreamVideoClient,
    useCall,
    SfuModels
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

    // ✅ HOOKS MUST BE AT TOP LEVEL
    useEffect(() => {
        if (!token) {
            setError("Access Denied: No security token found in URL.");
            return;
        }

        let isMounted = true;
        let streamClient = null;

        async function init() {
            try {
                // 1. Validate JWT structure and parse payload
                const parts = token.split('.');
                if (parts.length !== 3) throw new Error("Invalid token format.");

                const payloadBase64 = parts[1];
                const decodedPayload = JSON.parse(window.atob(payloadBase64));
                const userIdFromToken = decodedPayload.user_id;
                const expiry = decodedPayload.exp;

                // 2. Immediate Expiry Check
                if (Date.now() >= expiry * 1000) {
                    if (isMounted) setError("Session Expired: This link is no longer valid.");
                    return;
                }

                // 3. Initialize Stream Client
                const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
                streamClient = new StreamVideoClient({
                    apiKey,
                    user: { id: userIdFromToken },
                    token: token.trim(),
                });

                const activeCall = streamClient.call("default", roomid);

                // 4. THE FIX: Race the join call against a 5-second timeout
                // If the token is polluted, the SDK often hangs/retries endlessly.
                await Promise.race([
                    activeCall.join({ create: true, video: true, audio: true }),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error("Connection Timeout: The security token is likely invalid.")), 5000)
                    )
                ]);

                if (isMounted) {
                    setClient(streamClient);
                    setCall(activeCall);
                }

                // 5. Mid-session Expiry Timer
                const remainingMs = (expiry * 1000) - Date.now();
                const timeoutId = setTimeout(() => {
                    if (isMounted) setError("Session Expired: Disconnected from Studio.");
                }, remainingMs);

                return () => clearTimeout(timeoutId);

            } catch (err) {
                console.error("Connection Failure Detail:", err);
                if (isMounted) {
                    // Catching the "Unexpected end of JSON" or "401" from polluted tokens
                    const isAuthError = err.message?.includes("JSON") ||
                        err.message?.includes("Timeout") ||
                        err.message?.includes("401");

                    setError(isAuthError
                        ? "Security Error: Your broadcast token is corrupted or invalid."
                        : (err.message || "Failed to connect to the studio."));
                }
            }
        }

        init();

        return () => {
            isMounted = false;
            if (streamClient) streamClient.disconnectUser();
        };
    }, [token, roomid]);

    // --- RENDERING LOGIC ---

    // 1. Show Error Screen First
    if (error) {
        return (
            <div className="error-screen">
                <div className="error-card">
                    <div className="error-icon">⚠️</div>
                    <h2>Access Error</h2>
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()} className="retry-btn">
                        Try Again
                    </button>
                </div>
                <style jsx>{`
                    .error-screen { height: 100vh; display: grid; place-items: center; background: #020617; font-family: sans-serif; }
                    .error-card { text-align: center; color: white; padding: 40px; border: 1px solid #ef4444; border-radius: 24px; background: rgba(15, 23, 42, 0.9); max-width: 420px; width: 90%; }
                    .error-icon { font-size: 3rem; margin-bottom: 15px; }
                    h2 { margin: 0 0 10px 0; color: #ef4444; letter-spacing: 1px; }
                    p { color: #94a3b8; line-height: 1.6; margin-bottom: 25px; font-size: 15px; }
                    .retry-btn { background: #ef4444; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-weight: bold; transition: 0.2s; }
                    .retry-btn:hover { background: #dc2626; transform: translateY(-2px); }
                `}</style>
            </div>
        );
    }

    // 2. Show Loading Screen while connecting
    if (!client || !call) {
        return (
            <div className="loading-screen">
                <div className="spinner"></div>
                <p>Authenticating with Studio...</p>
                <style jsx>{`
                    .loading-screen { height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #000; color: white; font-family: sans-serif; }
                    .spinner { width: 40px; height: 40px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 20px; }
                    @keyframes spin { to { transform: rotate(360deg); } }
                    p { color: #64748b; font-size: 14px; letter-spacing: 0.5px; }
                `}</style>
            </div>
        );
    }

    // 3. Render the Broadcast UI
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
    const call = useCall();
    const [isFinished, setIsFinished] = useState(false);

    const host = participants.find((p) => p.userId.includes(roomid + "_host"));

    // Detect if anyone is sharing a screen
    const screenShareParticipant = participants.find((p) =>
        p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE) || p.screenShareStream
    );

    useEffect(() => {
        if (!call) return;
        const handleCallEvent = (event) => {
            if ((event.type === 'call.session_participant_left' &&
                event.participant.user.id === call.currentUserId) ||
                event.type === 'call.ended') {
                setIsFinished(true);
            }
        };
        const unsubscribe = call.on('all', handleCallEvent);
        return () => unsubscribe();
    }, [call]);

    // --- THE POLISHED EXIT SCREEN ---
    if (isFinished) {
        return (
            <div className="exit-screen">
                <div className="exit-card">
                    <div className="icon">🎬</div>
                    <h1>Broadcast Finished</h1>
                    <p>Thank you for participating in the session.</p>
                    <div className="status-badge">SESSION DISCONNECTED</div>
                </div>
                <style jsx>{`
                    .exit-screen {
                        height: 100vh;
                        width: 100vw;
                        display: grid;
                        place-items: center;
                        background: #020617;
                        font-family: sans-serif;
                    }
                    .exit-card {
                        text-align: center;
                        color: white;
                        padding: 60px 40px;
                        border: 1px solid #1e293b;
                        border-radius: 32px;
                        background: rgba(15, 23, 42, 0.8);
                        backdrop-filter: blur(12px);
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
                    }
                    .icon { font-size: 4rem; margin-bottom: 20px; }
                    h1 { font-size: 2rem; margin-bottom: 10px; font-weight: 700; }
                    p { color: #94a3b8; margin-bottom: 35px; font-size: 1.1rem; }
                    .status-badge {
                        display: inline-block;
                        padding: 6px 16px;
                        background: #1e293b;
                        color: #64748b;
                        border: 1px solid #334155;
                        border-radius: 8px;
                        font-size: 0.75rem;
                        font-weight: 600;
                        letter-spacing: 1.5px;
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="main-container">
            <div className={`video-grid ${screenShareParticipant ? 'has-share' : ''}`}>

                {/* STUDIO / HOST VIEW */}
                <div className="video-tile">
                    {host ? (
                        <ParticipantView
                            key={`${host.userId}-${screenShareParticipant?.userId === host.userId ? 'ss' : 'cam'}`}
                            participant={host}
                            trackType={screenShareParticipant?.userId === host.userId ? 'screenShareTrack' : 'videoTrack'}
                        />
                    ) : <div className="status">Waiting for Studio...</div>}
                    <div className="name-badge">STUDIO</div>
                </div>

                {/* GUEST / SELF VIEW */}
                <div className="video-tile">
                    {localParticipant ? (
                        <ParticipantView
                            key={`${localParticipant.userId}-${screenShareParticipant?.userId === localParticipant.userId ? 'ss' : 'cam'}`}
                            participant={localParticipant}
                            trackType={screenShareParticipant?.userId === localParticipant.userId ? 'screenShareTrack' : 'videoTrack'}
                            mirror={screenShareParticipant?.userId !== localParticipant.userId}
                        />
                    ) : <div className="status">Joining...</div>}
                    <div className="name-badge">YOU (LIVE)</div>
                </div>
            </div>

            <div className="floating-controls">
                <CallControls onLeave={() => setIsFinished(true)} />
            </div>

            <style jsx>{`
                .main-container { height: 100dvh; width: 100vw; background: #000; position: relative; overflow: hidden; }
                .video-grid { height: 100%; width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px; padding-bottom: 80px; }
                .video-tile { position: relative; background: #111; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
                .name-badge { position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.7); color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; z-index: 10; font-family: sans-serif; }
                .status { color: #444; font-size: 12px; }
                .floating-controls { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 100; }
                @media (max-width: 768px) { .video-grid { grid-template-columns: 1fr; grid-template-rows: 1fr 1fr; } }
            `}</style>
        </div>
    );
}
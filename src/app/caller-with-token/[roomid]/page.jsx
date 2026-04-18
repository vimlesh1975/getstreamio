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

    // ✅ 1. Move Client creation OUTSIDE the useEffect to avoid re-instantiating 
    // unless the token actually changes.
    useEffect(() => {
        if (!token || !roomid) {
            setError("Access Denied: No security token found in URL.");
            return;
        }

        let isMounted = true;
        let streamClient = null;

        async function init() {
            try {
                // Clean the token string from any potential URL noise
                const cleanToken = token.trim().replace(/\s/g, '');
                const parts = cleanToken.split('.');
                if (parts.length !== 3) throw new Error("Invalid token format.");

                const payloadBase64 = parts[1];
                // Fix: Use a safer base64 decode for Unicode/special chars
                const decodedPayload = JSON.parse(atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/')));
                const userIdFromToken = decodedPayload.user_id;
                const expiry = decodedPayload.exp;

                if (Date.now() >= expiry * 1000) {
                    if (isMounted) setError("Session Expired: This link is no longer valid.");
                    return;
                }

                const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;

                // ✅ Fix: Initialize client inside a local variable first
                streamClient = new StreamVideoClient({
                    apiKey,
                    user: { id: userIdFromToken },
                    token: cleanToken,
                });

                const activeCall = streamClient.call("default", roomid);

                // Inside your init function
                await Promise.race([
                    activeCall.join({ create: true, video: true, audio: true }),
                    new Promise((_, reject) =>
                        // Increased to 60 seconds for very slow mobile data
                        setTimeout(() => reject(new Error("TIMEOUT")), 120000)
                    )
                ]);

                if (isMounted) {
                    setClient(streamClient);
                    setCall(activeCall);
                    setError(null); // Clear any transient errors
                }

            } catch (err) {
                console.error("Connection Failure Detail:", err);
                if (isMounted) {
                    // If it fails, clean up immediately
                    if (streamClient) streamClient.disconnectUser();

                    const isAuthError = err.message?.includes("JSON") ||
                        err.message?.includes("401") ||
                        err.message?.includes("token");

                    setError(isAuthError
                        ? "Security Error: Token validation failed. Please refresh or request a new link."
                        : "Failed to connect to the studio.");
                }
            }
        }

        init();

        return () => {
            isMounted = false;
            // ✅ Fix: Use an IIFE for cleanup to ensure it actually fires
            if (streamClient) {
                (async () => {
                    try {
                        await streamClient.disconnectUser();
                    } catch (e) {
                        console.error("Cleanup error", e);
                    }
                })();
            }
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
                <div className="loading-text-area">
                    <p>Connecting to Broadcast Studio...</p>
                    <span className="network-note">
                        Slow connection detected. Please stay on this screen.
                    </span>
                </div>
                <style jsx>{`
                .loading-screen { 
                    height: 100vh; 
                    display: flex; 
                    flex-direction: column; 
                    align-items: center; 
                    justify-content: center; 
                    background: #000; 
                    color: white; 
                    font-family: sans-serif; 
                }
                .spinner { 
                    width: 50px; 
                    height: 50px; 
                    border: 3px solid rgba(255,255,255,0.1); 
                    border-top-color: #3b82f6; 
                    border-radius: 50%; 
                    animation: spin 1s linear infinite; 
                    margin-bottom: 25px; 
                }
                .loading-text-area { text-align: center; }
                p { color: white; font-size: 16px; margin: 0; }
                .network-note { 
                    color: #64748b; 
                    font-size: 12px; 
                    display: block; 
                    margin-top: 10px; 
                    font-style: italic;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
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
    const { useParticipants, useLocalParticipant, useCallCustomData } = useCallStateHooks();
    const participants = useParticipants();
    const localParticipant = useLocalParticipant();
    const customData = useCallCustomData();
    const call = useCall();
    const [isFinished, setIsFinished] = useState(false);

    const host = participants.find((p) => p.userId.includes(roomid + "_host"));

    // Detect if anyone is sharing a screen
    const screenShareParticipant = participants.find((p) =>
        p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE) || p.screenShareStream
    );

    // Handle explicitly targeted session kicks via synchronized call state
    useEffect(() => {
        if (!call || !localParticipant?.sessionId) return;
        if (customData?.kicked_sessions?.includes(localParticipant.sessionId)) {
             call.leave();
             setIsFinished(true);
        }
    }, [customData?.kicked_sessions, localParticipant?.sessionId, call]);

    useEffect(() => {
        if (!call) return;
        const handleCallEvent = (event) => {
            // Check if this specific session was the one that left, 
            // instead of user.id which drops all devices for the same user
            if ((event.type === 'call.session_participant_left' &&
                (event.participant.session_id === localParticipant?.sessionId || event.participant.sessionId === localParticipant?.sessionId)) ||
                event.type === 'call.ended') {
                setIsFinished(true);
            }
        };

        const unsubscribe = call.on('all', handleCallEvent);
        
        return () => {
            unsubscribe();
        };
    }, [call, localParticipant?.sessionId]);

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
                            ParticipantViewUI={null}
                        />
                    ) : <div className="status">Waiting for Studio...</div>}
                    <div className="name-badge">{roomid} STUDIO</div>
                </div>

                {/* GUEST / SELF VIEW */}
                <div className="video-tile">
                    {localParticipant ? (
                        <ParticipantView
                            key={`${localParticipant.userId}-${screenShareParticipant?.userId === localParticipant.userId ? 'ss' : 'cam'}`}
                            participant={localParticipant}
                            trackType={screenShareParticipant?.userId === localParticipant.userId ? 'screenShareTrack' : 'videoTrack'}
                            mirror={screenShareParticipant?.userId !== localParticipant.userId}
                            ParticipantViewUI={null}
                        />
                    ) : <div className="status">Joining...</div>}
                    <div className="name-badge">YOU (LIVE)</div>
                </div>
            </div>

            <div className="floating-controls">
                <CallControls onLeave={() => setIsFinished(true)} />
            </div>

            <style jsx>{`
                /* Global SDK Overrides */
                :global(.str-video__participant-details) { display: none !important; }
                :global(.str-video__generic-menu) { color: #ffffff !important; }
                
                /* Layout Container */
                .main-container { 
                    height: 100dvh; 
                    width: 100vw; 
                    background: #000; 
                    position: relative; 
                    overflow: hidden; 
                    display: flex;
                    align-items: center;
                }

                /* Fixed Horizontal Grid */
                .video-grid { 
                    width: 100%; 
                    display: grid; 
                    /* This ensures 2 columns even on the smallest phones */
                    grid-template-columns: 1fr 1fr; 
                    gap: 8px; 
                    padding: 8px; 
                    padding-bottom: 80px; 
                }

                .video-tile { 
                    position: relative; 
                    background: #111; 
                    border-radius: 12px; 
                    overflow: hidden; 
                    display: flex; 
                    align-items: center; 
                    justify-content: center; 
                    /* Keeps a 16:9 or similar broadcast shape */
                    aspect-ratio: 16 / 9; 
                    border: 1px solid #222;
                }

                .name-badge { 
                    position: absolute; 
                    bottom: 10px; 
                    left: 10px; 
                    background: rgba(0,0,0,0.7); 
                    color: white; 
                    padding: 4px 10px; 
                    border-radius: 6px; 
                    font-size: 10px; 
                    z-index: 10; 
                    font-family: sans-serif;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .status { color: #444; font-size: 12px; }

                .floating-controls { 
                    position: absolute; 
                    bottom: 20px; 
                    left: 50%; 
                    transform: translateX(-50%); 
                    z-index: 100; 
                }

                /* Mobile Optimization: Adjust gap and padding only, keep columns at 2 */
                @media (max-width: 768px) { 
                    .video-grid { gap: 4px; padding: 4px; padding-bottom: 90px; } 
                    .name-badge { font-size: 8px; padding: 2px 6px; bottom: 5px; left: 5px; }
                }
            `}</style>
        </div>
    );
}
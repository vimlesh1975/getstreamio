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
    const call = useCall();
    const [isFinished, setIsFinished] = useState(false);

    // 1. Identify participants and the active screen share
    const host = participants.find((p) => p.userId.includes(roomid + "_host"));

    const screenShareParticipant = participants.find((p) =>
        p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE)
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

    if (isFinished) return <ExitScreen />; // Keep your existing exit logic

    return (
        <div className="main-container">
            {/* 2. Grid class changes dynamically to accommodate the presentation */}
            <div className={`video-grid ${screenShareParticipant ? 'has-share' : ''}`}>

                {/* PRESENTATION SLOT: Appears only when someone is sharing */}
                {screenShareParticipant && (
                    <div className="video-tile screen-share-tile">
                        <ParticipantView
                            key={`${screenShareParticipant.userId}-screen`}
                            participant={screenShareParticipant}
                            trackType="screenShareTrack"
                            ParticipantViewUI={null}  // removes the default overlay UI
                            style={{ objectFit: 'contain' }}  // ← fix cropping
                        />
                        <div className="name-badge">PRESENTATION</div>
                    </div>
                )}

                {/* STUDIO FEED SLOT */}
                <div className="video-tile">
                    {host ? (
                        <ParticipantView
                            key={`${host.userId}-video`}
                            participant={host}
                            trackType="videoTrack"
                        />
                    ) : (
                        <div className="status">Waiting for Studio...</div>
                    )}
                    <div className="name-badge">STUDIO ({roomid})</div>
                </div>

                {/* GUEST SELF-VIEW SLOT */}
                <div className="video-tile">
                    {localParticipant ? (
                        <ParticipantView
                            key={`${localParticipant.userId}-video`}
                            participant={localParticipant}
                            trackType="videoTrack"
                            mirror={true}
                        />
                    ) : (
                        <div className="status">Initializing Camera...</div>
                    )}
                    <div className="name-badge">YOU (LIVE)</div>
                </div>
            </div>

            <div className="floating-controls">
                <CallControls onLeave={() => setIsFinished(true)} />
            </div>

            <style jsx global>{`
    .main-container { height: 100dvh; width: 100vw; background: #000; position: relative; overflow: hidden; }
    
    /* Default 2-column grid */
    .video-grid { 
        height: 100%; width: 100%; 
        display: grid; 
        grid-template-columns: 1fr 1fr; 
        gap: 8px; padding: 8px; padding-bottom: 80px; 
    }

    /* ✅ This will now reach inside the SDK's video element */
    .screen-share-tile video {
        object-fit: contain !important;
        background: #000;
    }

    /* 3-tile grid layout when sharing: 1 large on left, 2 small on right */
    .video-grid.has-share {
        grid-template-columns: 2.5fr 1fr;
        grid-template-rows: 1fr 1fr;
    }

    .screen-share-tile {
        grid-row: span 2;
        border: 2px solid #3b82f6;
    }

    .video-tile { position: relative; background: #1a1a1a; border-radius: 12px; overflow: hidden; display: flex; align-items: center; justify-content: center; }
    .name-badge { position: absolute; bottom: 10px; left: 10px; background: rgba(0,0,0,0.6); color: white; padding: 4px 8px; border-radius: 4px; font-size: 11px; z-index: 5; }
    .status { color: #555; font-family: sans-serif; }
    .floating-controls { position: absolute; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 100; width: auto; display: flex; justify-content: center; background: rgba(0, 0, 0, 0.6); padding: 10px; border-radius: 30px; backdrop-filter: blur(4px); }
    
    @media (max-width: 768px) {
        .video-grid.has-share { grid-template-columns: 1fr; grid-template-rows: 2fr 1fr 1fr; }
        .screen-share-tile { grid-row: span 1; }
    }
`}</style>
        </div>
    );
}
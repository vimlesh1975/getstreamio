"use client";

import { useEffect, useState, use } from "react";
import {
  StreamVideo,
  StreamCall,
  ParticipantView,
  useCallStateHooks,
  StreamTheme,
  CallControls,
} from "@stream-io/video-react-sdk";
import "@stream-io/video-react-sdk/dist/css/styles.css";
import { createStreamClient } from "@/lib/stream";

export default function MeetingPage({ params }) {
  // 1. Extract roomid from dynamic route /caller/[roomid]
  const resolvedParams = use(params);
  const roomid = resolvedParams.roomid;
  const [userId] = useState(() => roomid + "_" + Math.random().toString(36).slice(2, 8));

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);


  useEffect(() => {
    async function init() {
      const c = await createStreamClient(userId);
      const newCall = c.call("default", roomid);

      await newCall.join({ create: true, video: true, audio: true });

      setClient(c);
      setCall(newCall);
    }
    init();

    return () => { if (call) call.leave(); };
  }, [userId]);

  if (!client || !call) return <div style={{ color: 'white' }}>Loading...</div>;

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

  const host = participants.find((p) => p.userId.includes(roomid + "_host"));

  return (
    <div className="main-container">
      <div className="video-grid">
        {/* HOST TILE */}
        <div className="video-tile">
          {host ? <ParticipantView participant={host} /> : <div className="status">Waiting...</div>}
          <div className="name-badge">Host</div>
        </div>

        {/* YOUR TILE */}
        <div className="video-tile">
          {localParticipant ? (
            <ParticipantView participant={localParticipant} mirror={true} />
          ) : (
            <div className="status">Camera...</div>
          )}
          <div className="name-badge">You</div>
        </div>
      </div>

      {/* FIXED CONTROLS OVERLAY */}
      <div className="floating-controls">
        <CallControls onLeave={() => window.location.href = "/"} />
      </div>

      <style jsx>{`
        .main-container {
          /* Use dvh (Dynamic Viewport Height) to fix Android address bar issues */
          height: 100dvh; 
          width: 100vw;
          background: #000;
          position: relative; /* Needed for absolute positioning context */
          overflow: hidden;
        }

        .video-grid {
          height: 100%;
          width: 100%;
          display: grid;
          /* LANDSCAPE DEFAULT: Side-by-Side */
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          padding: 8px;
          /* Add bottom padding so video isn't covered by controls */
          padding-bottom: 80px; 
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
          background: rgba(0,0,0,0.6);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          z-index: 5;
        }

        .status { color: #555; font-family: sans-serif; }

        /* --- FIXED CONTROLS CSS --- */
        .floating-controls {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100; /* Ensure it sits ON TOP of video */
          width: auto;
          display: flex;
          justify-content: center;
          /* Optional: Add a subtle background pill for contrast */
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
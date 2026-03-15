"use client";

import { Suspense, useEffect, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  ParticipantView,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";
import { useSearchParams } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function ProgramPage() {
  return (
    <Suspense fallback={<div style={{ background: 'black', height: '100vh' }} />}>
      <ProgramLoader />
    </Suspense>
  );
}

function ProgramLoader() {
  const params = useSearchParams();
  const out = params.get("out") || "1";
  // 👈 1. Get the room ID from the URL (e.g., ?room=Studio_Alpha)
  const roomid = params.get("room");

  const userId = `Out-${out}-${roomid}`; // Unique ID per room/output
  const programKey = `Out${out}`;

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", roomid);

      // 🔑 REQUIRED CHANGE: Explicitly join without requesting hardware to fix Caspar error
      await call.join({ create: true, video: false, audio: false });

      setClient(c);
      setCall(call);
    })();
  }, [userId]);

  if (!client || !call) return null;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <ProgramInner programKey={programKey} />
      </StreamCall>
    </StreamVideo>
  );
}

function ProgramInner({ programKey }) {
  const call = useCall();
  const { useParticipants, useCallCustomData } = useCallStateHooks();

  const participants = useParticipants();
  const custom = useCallCustomData();

  useEffect(() => {
    call.camera.disable();
    call.microphone.disable();

    // Auto-refresh on call end to keep the meter from running
    const unsubscribe = call.on('call.ended', () => window.location.reload());
    return () => unsubscribe();
  }, [call]);

  const liveUserId = custom?.programs?.['Out1'];
  const liveUserId2 = custom?.programs?.['Out2']; // Adjusted key for clarity

  const liveCaller = participants.find((p) => p.userId === liveUserId);
  const liveCaller2 = participants.find((p) => p.userId === liveUserId2);

  return (
    <>
      <style jsx global>{`
        html, body { 
          margin: 0; padding: 0; 
          width: 100vw; height: 100vh; 
          overflow: hidden; background: black; 
        }
        
        /* The main 1920x1080 wrapper */
        .split-container {
          display: flex;
          width: 100vw;
          height: 100vh;
          background: black;
          align-items: stretch;
        }

        /* Each side is exactly 50% width and 100% height */
        .video-box {
          flex: 1; 
          height: 100vh;
          position: relative;
          overflow: hidden; /* This performs the crop */
        }

        /* Target all SDK layers to ensure they don't add black bars */
        :global(.str-video__participant-view),
        :global(.str-video__video-container),
        :global(.str-video__participant-view__video) {
          width: 100% !important;
          height: 100% !important;
        }

        video {
          width: 100% !important;
          height: 100% !important;
          /* 'cover' crops the left/right but keeps height full */
          object-fit: cover !important; 
          display: block !important;
          transform: scaleX(1) !important;
        }

        :global(.str-video__participant-details),
        :global(.str-video__participant-view__info) { 
          display: none !important; 
        }
      `}</style>

      {!liveCaller ? (
        <div style={{ width: "100vw", height: "100vh", display: "grid", placeItems: "center", color: "white", fontSize: 32 }}>
          Waiting for live source…
        </div>
      ) : (
        <div className="split-container">
          {/* Left Guest */}
          <div className="video-box">
            <ParticipantView participant={liveCaller} drawParticipantInfo={false} />
          </div>

          {/* Right Guest - only shows if liveUserId2 is set */}
          {liveCaller2 && (
            <div className="video-box" style={{ borderLeft: '2px solid black' }}>
              <ParticipantView participant={liveCaller2} drawParticipantInfo={false} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
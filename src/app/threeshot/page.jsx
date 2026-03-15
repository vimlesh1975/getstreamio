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

    const unsubscribe = call.on('call.ended', () => window.location.reload());
    return () => unsubscribe();
  }, [call]);

  // Fetching 3 specific keys from custom data
  const liveUserId1 = custom?.programs?.['Out1'];
  const liveUserId2 = custom?.programs?.['Out2'];
  const liveUserId3 = custom?.programs?.['Out3'];

  const caller1 = participants.find((p) => p.userId === liveUserId1);
  const caller2 = participants.find((p) => p.userId === liveUserId2);
  const caller3 = participants.find((p) => p.userId === liveUserId3);

  return (
    <>
      <style jsx global>{`
        html, body { 
          margin: 0; padding: 0; 
          width: 100vw; height: 100vh; 
          overflow: hidden; background: black; 
        }
        
        .split-container {
          display: flex;
          width: 100vw;
          height: 100vh;
          background: black;
          align-items: stretch; /* Forces all boxes to match tallest height */
        }

        .video-box {
          flex: 1; /* Automatically divides 100vw by number of active boxes */
          height: 100vh;
          position: relative;
          overflow: hidden;
          border-right: 2px solid black; /* Thin separator */
        }

        .video-box:last-child {
          border-right: none;
        }

        :global(.str-video__participant-view),
        :global(.str-video__video-container),
        :global(.str-video__participant-view__video) {
          width: 100% !important;
          height: 100% !important;
        }

        video {
          width: 100% !important;
          height: 100% !important;
          /* 'cover' is the secret—it crops the width to fit the 33% slice */
          object-fit: cover !important; 
          display: block !important;
          transform: scaleX(1) !important;
        }

        :global(.str-video__participant-details),
        :global(.str-video__participant-view__info) { 
          display: none !important; 
        }
      `}</style>

      {!caller1 && !caller2 && !caller3 ? (
        <div style={{ width: "100vw", height: "100vh", display: "grid", placeItems: "center", color: "white", fontSize: 32 }}>
          Waiting for live sources…
        </div>
      ) : (
        <div className="split-container">
          {caller1 && (
            <div className="video-box">
              <ParticipantView participant={caller1} drawParticipantInfo={false} />
            </div>
          )}

          {caller2 && (
            <div className="video-box">
              <ParticipantView participant={caller2} drawParticipantInfo={false} />
            </div>
          )}

          {caller3 && (
            <div className="video-box">
              <ParticipantView participant={caller3} drawParticipantInfo={false} />
            </div>
          )}
        </div>
      )}
    </>
  );
}
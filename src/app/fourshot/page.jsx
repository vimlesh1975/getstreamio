"use client";

import { Suspense, useEffect, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  ParticipantView,
  useCall,
  useCallStateHooks,
  SfuModels,

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


  const screenShareParticipant = participants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE)
  );

  useEffect(() => {
    call.camera.disable();
    call.microphone.disable();

    const unsubscribe = call.on('call.ended', () => window.location.reload());
    return () => unsubscribe();
  }, [call]);

  // Fetching 4 specific keys
  const ids = [
    custom?.programs?.['Out1'],
    custom?.programs?.['Out2'],
    custom?.programs?.['Out3'],
    custom?.programs?.['Out4']
  ];

  const callers = ids.map(id => participants.find(p => p.userId === id));

  return (
    <>
      <style jsx global>{`
        html, body { 
          margin: 0; padding: 0; 
          width: 100vw; height: 100vh; 
          overflow: hidden; background: black; 
        }
        
        .split-container {
          display: grid;
          /* 2 columns and 2 rows for a perfect 2x2 grid */
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          width: 100vw;
          height: 100vh;
          background: black;
        }

        .video-box {
          width: 100%;
          height: 100%;
          position: relative;
          overflow: hidden;
          /* Thin dividers */
          outline: 1px solid black; 
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
          /* 'cover' now crops both width AND height to fill the quadrant */
          object-fit: cover !important; 
          display: block !important;
          transform: scaleX(1) !important;
        }

        :global(.str-video__participant-details),
        :global(.str-video__participant-view__info) { 
          display: none !important; 
        }
      `}</style>

      {!callers.some(c => c) ? (
        <div style={{ width: "100vw", height: "100vh", display: "grid", placeItems: "center", color: "white", fontSize: 32 }}>
          Waiting for live sources…
        </div>
      ) : (
        <div className="split-container">
          {callers.map((caller, index) => (
            <div key={index} className="video-box">
              {caller && (
                <ParticipantView
                  participant={caller}
                  trackType={(screenShareParticipant?.userId === caller.userId) ? 'screenShareTrack' : 'videoTrack'} // 👈 Forces the switch
                  drawParticipantInfo={false} />
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
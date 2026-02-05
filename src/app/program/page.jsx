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

// 1. This is your main entry point (The Shell)
export default function ProgramPage() {
  return (
    <Suspense fallback={<div style={{ background: 'black', height: '100vh' }} />}>
      <ProgramLoader />
    </Suspense>
  );
}

// 2. This component safely uses useSearchParams
function ProgramLoader() {
  const params = useSearchParams();
  const out = params.get("out") || "1";

  const userId = `program-${out}`;
  const programKey = `program${out}`;

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");
      await call.join({ video: false, audio: false });

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
  const { useParticipants, useCallCustomData } =
    useCallStateHooks();

  const participants = useParticipants();
  const custom = useCallCustomData();

  useEffect(() => {
    call.camera.disable();
    call.microphone.disable();
  }, [call]);

  // 🔑 READ PROGRAM-SPECIFIC USER
  const liveUserId = custom?.programs?.[programKey];

  // Find participant by userId (STABLE)
  const liveCaller = participants.find(
    (p) => p.userId === liveUserId
  );

  return (
    <>
      {/* 🔴 YOUR FULLSCREEN / OBS CSS (UNCHANGED) */}
      <style jsx global>{`
        html,
        body,
        #__next {
          margin: 0 !important;
          padding: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          overflow: hidden !important;
          background: black !important;
        }

        [data-testid],
        [class*="stream"],
        [class*="participant"],
        .str-video,
        .str-video__call,
        .str-video__participant,
        .str-video__participant-view,
        .str-video__video {
          width: 100vw !important;
          height: 100vh !important;
          max-width: none !important;
          max-height: none !important;
        }

        video {
          width: 100vw !important;
          height: 100vh !important;
          object-fit: fill !important;
          transform: scaleX(-1) !important;
          display: block !important;
        }
      `}</style>

      {!liveCaller ? (
        <div
          style={{
            width: "100vw",
            height: "100vh",
            display: "grid",
            placeItems: "center",
            background: "black",
            color: "white",
            fontSize: 32,
          }}
        >
          Waiting for live source…
        </div>
      ) : (
        <>
          {/* USER LABEL */}
          <h1
            style={{
              color: "white",
              backgroundColor: "black",
              fontSize: 100,
              position: "absolute",
              top: 800,
              left: 700,
              zIndex: 2,
            }}
          >
            {liveCaller.userId}
          </h1>

          {/* LIVE VIDEO */}
          <div style={{ zIndex: 0 }}>
            <ParticipantView participant={liveCaller} />
          </div>
        </>
      )}
    </>
  );
}



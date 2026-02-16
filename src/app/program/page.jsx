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

  const userId = `program-${out}-${roomid}`; // Unique ID per room/output
  const programKey = `program${out}`;

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
  const { useParticipants, useCallCustomData } =
    useCallStateHooks();

  const participants = useParticipants();
  const custom = useCallCustomData();

  useEffect(() => {
    call.camera.disable();
    call.microphone.disable();
  }, [call]);

  const liveUserId = custom?.programs?.[programKey];

  const liveCaller = participants.find(
    (p) => p.userId === liveUserId
  );

  return (
    <>
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
          transform: scaleX(1) !important;
          display: block !important;
        }

        /* 🔑 REQUIRED CHANGE: Forcefully hide the built-in SDK UserID labels */
        :global(.str-video__participant-details),
        :global(.str-video__participant-view__info),
        :global(.str-video__participant-view__name-area) {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
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
          <div style={{ zIndex: 0 }}>
            {/* 🔑 REQUIRED CHANGE: drawParticipantInfo={false} to help hide the label */}
            <ParticipantView
              participant={liveCaller}
              drawParticipantInfo={false}
            />
          </div>
        </>
      )}
    </>
  );
}
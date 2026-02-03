"use client";

import { useEffect, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  ParticipantView,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";

export default function ProgramPage() {
  const userId = "program";
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
  }, []);

  if (!client || !call) return null;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <ProgramInner />
      </StreamCall>
    </StreamVideo>
  );
}

function ProgramInner() {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  useEffect(() => {
    call.camera.disable();
    call.microphone.disable();
  }, [call]);

  const firstCaller = participants.find(
    (p) => !p.isLocal && p.userId !== "host"
  );

  return (
    <>
      {/* 🔴 ABSOLUTE OVERRIDE — ALL STREAM WRAPPERS */}
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

        /* Force EVERY wrapper to full size */
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
          transform: scaleX(-1) !important; /* 👈 MIRROR */
          display: block !important;
        }
      `}</style>

      {!firstCaller ? (
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
          Waiting for caller…
        </div>
      ) : (
        <ParticipantView participant={firstCaller} />
      )}
    </>
  );
}

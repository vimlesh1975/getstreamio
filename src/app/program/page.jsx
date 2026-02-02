"use client";

import { useEffect, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  ParticipantView,
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

      // Program joins silently (no camera)
      await call.join({ video: false, audio: false });

      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <p>Loading program…</p>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <ProgramInner />
      </StreamCall>
    </StreamVideo>
  );
}

function ProgramInner() {
  const { useParticipants, useCallCustomData } = useCallStateHooks();
  const participants = useParticipants();
  const custom = useCallCustomData();

  const liveUserId = custom?.liveUserId;
  const live = participants.find(
    p => p.userId === liveUserId
  );

  if (!live) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "grid",
          placeItems: "center",
          background: "black",
          color: "white",
        }}
      >
        Waiting for LIVE source…
      </div>
    );
  }

  return (
    <ParticipantView
      participant={live}
      style={{
        width: "100vw",
        height: "100vh",
        background: "black",
      }}
    />
  );
}

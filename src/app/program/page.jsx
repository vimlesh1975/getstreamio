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

      // ✅ Join silently (viewer only)
      await call.join({
        video: false,
        audio: false,
      });

      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) {
    return <p>Loading program…</p>;
  }

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
const custom = useCallCustomData();


  useEffect(() => {
    call.camera.disable();
    call.microphone.disable();
  }, [call]);


const liveUserId = custom?.liveUserId;

const liveCaller = participants.find(
  (p) => p.userId === liveUserId
);

  if (!firstCaller) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "black",
          color: "white",
          display: "grid",
          placeItems: "center",
        }}
      >
        Waiting for caller…
      </div>
    );
  }
if (!liveCaller) {
  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: "black",
        color: "white",
        display: "grid",
        placeItems: "center",
      }}
    >
      Waiting for LIVE selection…
    </div>
  );
}
  return (
    <ParticipantView
      participant={liveCaller}
      style={{
        width: "100vw",
        height: "100vh",
        background: "black",
      }}
    />
  );
}

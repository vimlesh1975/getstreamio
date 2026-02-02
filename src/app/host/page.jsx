"use client";

import { useEffect, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  CallControls,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";
import { setLiveParticipant } from "@/state/output";

export default function HostPage() {
  const userId = "host";
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");
      await call.join({ create: true, video: true, audio: true });
      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <p>Joining as host…</p>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <HostUI call={call} />
      </StreamCall>
    </StreamVideo>
  );
}

function HostUI({ call }) {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
const custom = useCallCustomData();

const callers = participants.filter(
  (p) => !p.isLocal && p.userId !== "host"
);

async function takeLive(userId) {
  await call.updateCustomData({
    liveUserId: userId,
  });
}
  return (
    <div style={{ padding: 16 }}>
      <h1>🎬 Host Control Room</h1>

     {callers.map((caller) => (
  <div key={caller.sessionId}>
    <ParticipantView
      participant={caller}
      style={{ width: 260, height: 180 }}
    />

    <button
      onClick={() => takeLive(caller.userId)}
      style={{
        marginTop: 6,
        background:
          custom?.liveUserId === caller.userId
            ? "red"
            : "#333",
        color: "white",
        padding: "6px 10px",
      }}
    >
      {custom?.liveUserId === caller.userId
        ? "🔴 LIVE"
        : "TAKE LIVE"}
    </button>
  </div>
))}


      <CallControls />
    </div>
  );
}

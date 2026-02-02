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

  return (
    <div style={{ padding: 16 }}>
      <h1>🎬 Host Control Room</h1>

      {participants.map((p) => (
        <div key={p.sessionId} style={{ marginBottom: 10 }}>
          <span>{p.userId}</span>
          <button
            style={{ marginLeft: 10 }}
            onClick={() => setLiveParticipant(call, p.userId)}
          >
            TAKE LIVE
          </button>
        </div>
      ))}

      <CallControls />
    </div>
  );
}

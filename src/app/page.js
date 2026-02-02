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

export default function HostPage() {
  const userId = "host";
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");

      // Host joins immediately (no media)
      await call.join({
        create: false,
        video: false,
        audio: false,
      });

      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <p>Loading host…</p>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <HostInner />
      </StreamCall>
    </StreamVideo>
  );
}

function HostInner() {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  const [accepted, setAccepted] = useState(false);

  // Enable / disable host media
  useEffect(() => {
    if (!call) return;

    if (!accepted) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [call, accepted]);

  const local = participants.find(p => p.isLocal);
  const callers = participants.filter(p => !p.isLocal);

  const hasCaller = callers.length > 0;

  // BEFORE ACCEPT
  if (!accepted) {
    return (
      <div style={{ padding: 20 }}>
        <h1>🎧 Host</h1>

        <p>Incoming callers: {callers.length}</p>

        <button
          onClick={() => setAccepted(true)}
          disabled={!hasCaller}
          style={{ padding: "10px 16px", fontSize: 16 }}
        >
          {hasCaller ? "✅ Accept Call" : "Waiting for call…"}
        </button>
      </div>
    );
  }

  // AFTER ACCEPT
  return (
    <div style={{ padding: 20 }}>
      <h1>🎥 Host + Callers</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {/* HOST SELF */}
        {local && (
          <div>
            <p>Host (You)</p>
            <ParticipantView
              participant={local}
              muted
              style={{ width: 300, height: 220 }}
            />
          </div>
        )}

        {/* ALL CALLERS */}
        {callers.map((caller) => (
          <div key={caller.sessionId}>
            <p>{caller.userId}</p>
            <ParticipantView
              participant={caller}
              style={{ width: 300, height: 220 }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

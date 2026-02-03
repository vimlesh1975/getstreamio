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

      // Host joins early (no media)
      await call.join({ video: false, audio: false });

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
  const { useParticipants, useCallCustomData } = useCallStateHooks();
  const participants = useParticipants();
  const custom = useCallCustomData();

  const [accepted, setAccepted] = useState(false);

  async function setLiveIndex(index) {
    await fetch("/api/set-live-index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liveIndex: index }),
    });
  }




  // Enable host camera only after accept
  useEffect(() => {
    if (!accepted) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [call, accepted]);

  const local = participants.find(p => p.isLocal);
  // const callers = participants.filter(p => !p.isLocal);
  // const callers = participants.filter(
  //   (p) => !p.isLocal && p.userId !== "host"
  //   // (p) => !p.isLocal && p.userId !== "host" && p.userId !== "program"
  // );
  const callers = [...participants];
  const hasCaller = callers.length > 0;

  if (!accepted) {
    return (
      <div style={{ padding: 20 }}>
        <h1>🎧 Host</h1>
        <button
          disabled={!hasCaller}
          onClick={() => setAccepted(true)}
        >
          {hasCaller ? "✅ Accept Call" : "Waiting for call…"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🎥 Host Control</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {/* Host self preview */}
        {local && (
          <div>
            <p>Host (You)</p>
            <ParticipantView
              participant={local}
              muted
              style={{ width: 260, height: 180 }}
            />
          </div>
        )}

        {/* Callers */}


        {callers.map((caller, index) => (
          <div key={caller.sessionId} style={{ marginBottom: 8 }}>
            <span>{caller.userId}</span>
            <ParticipantView
              participant={caller}
              muted
              style={{ width: 260, height: 180 }}
            />

            <button
              style={{ marginLeft: 10 }}
              onClick={() => setLiveIndex(index)}
            >
              TAKE LIVE {index}
            </button>
          </div>
        ))}

      </div>
    </div>
  );
}

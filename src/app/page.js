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
  await call.updateCustomData({
    liveIndex: index,
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
  const callers = participants.filter(
  (p) => !p.isLocal && p.userId !== "host" && p.userId !== "program"
);

  const hasCaller = callers.length > 0;

  async function takeLive(userId) {
    // 🔴 Set shared LIVE state
    await call.updateCustomData({ liveUserId: userId });
  }

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
        {callers.map(caller => (
          <div key={caller.sessionId}>
            <p>{caller.userId}</p>
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
              }}
            >
              {custom?.liveUserId === caller.userId
                ? "🔴 LIVE"
                : "TAKE LIVE"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

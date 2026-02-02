"use client";

import { useEffect, useState } from "react";
import {
  StreamVideo,
  StreamCall,
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

      // ✅ Host joins immediately (NO media)
      await call.join({
        create: false,
        video: false,
        audio: false,
      });

      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) {
    return <p>Loading host…</p>;
  }

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

  // 🔑 Enable / disable host camera based on accept
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

  // Detect caller presence
  const hasCaller = participants.some((p) => !p.isLocal);

  const local = participants.find((p) => p.isLocal);
  const remote = participants.find((p) => !p.isLocal);

  // 🟡 BEFORE ACCEPT
  if (!accepted) {
    return (
      <div style={{ padding: 20 }}>
        <h1>🎧 Host</h1>

        <button
          onClick={() => setAccepted(true)}
          disabled={!hasCaller}
          style={{
            padding: "10px 16px",
            fontSize: 16,
            cursor: hasCaller ? "pointer" : "not-allowed",
          }}
        >
          {hasCaller ? "✅ Accept Call" : "Waiting for call…"}
        </button>
      </div>
    );
  }

  // 🟢 AFTER ACCEPT
  return (
    <div style={{ padding: 20 }}>
      <h1>🎥 Host + Caller</h1>

      <div style={{ display: "flex", gap: 20 }}>
        {/* HOST SELF CAMERA */}
        {local?.videoStream && (
          <video
            ref={(el) => el && (el.srcObject = local.videoStream)}
            autoPlay
            playsInline
            muted
            style={{
              width: 400,
              height: 300,
              background: "black",
            }}
          />
        )}

        {/* CALLER CAMERA */}
        {remote?.videoStream ? (
          <video
            ref={(el) => el && (el.srcObject = remote.videoStream)}
            autoPlay
            playsInline
            muted
            style={{
              width: 400,
              height: 300,
              background: "black",
            }}
          />
        ) : (
          <p>Waiting for caller video…</p>
        )}
      </div>
    </div>
  );
}

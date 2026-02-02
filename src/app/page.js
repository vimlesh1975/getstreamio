"use client";

import { useEffect, useRef, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";

export default function ReceiverPage() {
  const userId = "receiver";
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");

      // ✅ HOST JOINS IMMEDIATELY (NO MEDIA)
      await call.join({
        create: false,
        video: false,
        audio: false,
      });

      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <p>Loading receiver…</p>;

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
  const videoRef = useRef(null);
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  const [accepted, setAccepted] = useState(false);

  // 🔒 Host NEVER publishes
  useEffect(() => {
    call.camera.disable();
    call.microphone.disable();
  }, [call]);

  // 👀 Caller presence (now WORKS)
  const hasCaller = participants.some((p) => !p.isLocal);

  // 🎥 Only render AFTER accept
  const remote = accepted
    ? participants.find((p) => !p.isLocal && p.videoStream)
    : null;

  useEffect(() => {
    if (remote?.videoStream && videoRef.current) {
      videoRef.current.srcObject = remote.videoStream;
    }
  }, [remote]);

  if (!accepted) {
    return (
      <button
        onClick={() => setAccepted(true)}
        disabled={!hasCaller}
      >
        {hasCaller ? "✅ Accept Call" : "Waiting for call…"}
      </button>
    );
  }

  if (!remote) {
    return <h2>Waiting for caller video…</h2>;
  }

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{
        width: "100vw",
        height: "100vh",
        background: "black",
      }}
    />
  );
}

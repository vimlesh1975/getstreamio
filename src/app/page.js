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
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");
      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <p>Loading…</p>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <HostInner
          call={call}
          accepted={accepted}
          setAccepted={setAccepted}
        />
      </StreamCall>
    </StreamVideo>
  );
}

function HostInner({ call, accepted, setAccepted }) {
  const videoRef = useRef(null);
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  // 🔴 HARD RULE: host never publishes
  useEffect(() => {
    call.camera.disable();
    call.microphone.disable();
  }, [call]);

  async function acceptCall() {
    setAccepted(true);

    // Join WITHOUT media
    await call.join({
      create: false,
      video: false,
      audio: false,
    });
  }

  // ✅ pick ONLY remote participant WITH video
  const remote = participants.find(
    (p) => !p.isLocal && p.videoStream
  );

  useEffect(() => {
    if (remote?.videoStream && videoRef.current) {
      videoRef.current.srcObject = remote.videoStream;
    }
  }, [remote]);

  if (!accepted) {
    const hasCaller = participants.some((p) => !p.isLocal);

    return (
      <button onClick={acceptCall} disabled={!hasCaller}>
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

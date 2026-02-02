"use client";

import { useEffect, useRef, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";

export default function ReceiverPage() {
  const userId = "receiver"; // control-only user
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");

      // 🔴 Join WITHOUT camera or mic
      await call.join({
        create: false,
        video: false,
        audio: false,
      });

      // 🔴 FORCE disable local devices
      await call.camera.disable();
      await call.microphone.disable();

      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <p>Waiting for caller…</p>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <RemoteOnlyVideo />
      </StreamCall>
    </StreamVideo>
  );
}

function RemoteOnlyVideo() {
  const videoRef = useRef(null);
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  // ✅ ONLY remote participants
  const remote = participants.find((p) => !p.isLocal);

  useEffect(() => {
    if (remote?.videoStream && videoRef.current) {
      videoRef.current.srcObject = remote.videoStream;
    }
  }, [remote]);

  if (!remote) {
    return <h2>No caller yet…</h2>;
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

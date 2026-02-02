"use client";

import { useEffect, useRef, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";

export default function HostPage() {
  const userId = "receiver";
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");

      // 🚫 NEVER publish from host
      await call.join({
        create: false,
        video: false,
        audio: false,
      });

      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <p>Waiting for caller…</p>;

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

  // 🔒 HARD LOCK: host cannot publish
  useEffect(() => {
    if (!call) return;
    call.camera.disable();
    call.microphone.disable();
  }, [call]);

  return <RemoteOnlyVideo />;
}

function RemoteOnlyVideo() {
  const videoRef = useRef(null);
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  // 🔴 ONLY remote participants WITH video
  const remote = participants.find(
    p => !p.isLocal && p.videoStream
  );

  useEffect(() => {
    if (remote && videoRef.current) {
      videoRef.current.srcObject = remote.videoStream;
    }
  }, [remote]);

  if (!remote) return <h2>No remote video yet…</h2>;

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      style={{ width: "100vw", height: "100vh", background: "black" }}
    />
  );
}

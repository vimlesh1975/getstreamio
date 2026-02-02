"use client";

import { useEffect, useRef, useState } from "react";
import {
  StreamVideo,
  StreamCall,
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
      setClient(c);
      setCall(c.call("default", "room-1"));
    })();
  }, []);

  if (!client || !call) return <p>Loading receiver…</p>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <ReceiverInner call={call} accepted={accepted} setAccepted={setAccepted} />
      </StreamCall>
    </StreamVideo>
  );
}

function ReceiverInner({ call, accepted, setAccepted }) {
  const videoRef = useRef(null);
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  async function acceptCall() {
    setAccepted(true);

    // Join WITHOUT camera
    await call.join({ create: false });

    // Make sure host never publishes
    await call.camera.disable();
    await call.microphone.disable();
  }

  const remote = participants.find(p => !p.isLocal && p.videoStream);

  useEffect(() => {
    if (remote?.videoStream && videoRef.current) {
      videoRef.current.srcObject = remote.videoStream;
    }
  }, [remote]);

  return (
    <div style={{ padding: 20 }}>
      <h1>🎧 Receiver</h1>

      {!accepted ? (
        <button onClick={acceptCall}>✅ Accept Call</button>
      ) : remote ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100vw", height: "100vh", background: "black" }}
        />
      ) : (
        <p>Waiting for caller video…</p>
      )}
    </div>
  );
}

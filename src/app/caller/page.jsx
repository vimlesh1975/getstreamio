"use client";

import { useEffect, useRef, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  useCall,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";

export default function CallerPage() {
  const userId = "caller-" + Math.random().toString(36).slice(2, 7);
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      setClient(c);
      setCall(c.call("default", "room-1"));
    })();
  }, []);

  if (!client || !call) return <p>Loading caller…</p>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallerInner call={call} calling={calling} setCalling={setCalling} />
      </StreamCall>
    </StreamVideo>
  );
}

function CallerInner({ call, calling, setCalling }) {
  const videoRef = useRef(null);

 async function startCall() {
  setCalling(true);

  // 🔴 JOIN WITH VIDEO ENABLED
  await call.join({
    create: true,
    video: true,
    audio: false,
  });

  // attach preview so caller can see self
  if (call.camera.state.mediaStream && videoRef.current) {
    videoRef.current.srcObject =
      call.camera.state.mediaStream;
  }
}


  return (
    <div style={{ padding: 20 }}>
      <h1>📞 Caller</h1>

      {!calling ? (
        <button onClick={startCall}>📲 Call</button>
      ) : (
        <>
          <p>Calling…</p>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{ width: 400, background: "black" }}
          />
        </>
      )}
    </div>
  );
}

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

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");

      await call.join({
        create: true,
        video: false,
        audio: false,
      });

      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <p>Joining…</p>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallerInner />
      </StreamCall>
    </StreamVideo>
  );
}

function CallerInner() {
  const call = useCall();
  const videoRef = useRef(null);

  useEffect(() => {
    if (!call) return;

    async function startCamera() {
      await call.camera.enable();

      // attach preview so you SEE it's on
      if (call.camera.state.mediaStream && videoRef.current) {
        videoRef.current.srcObject =
          call.camera.state.mediaStream;
      }
    }

    startCamera();
  }, [call]);

  return (
    <>
      <h2>Caller camera (you should see yourself)</h2>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{ width: 400, height: 300, background: "black" }}
      />
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  useCall,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";

export default function CallerPage() {
  const userId = "caller-" + Math.random().toString(36).slice(2, 8);
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");

      // Join call (do NOT rely on auto camera)
      await call.join({
        create: true,
        video: false,
        audio: false,
      });

      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <p>Joining as caller…</p>;

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

    async function enableCamera() {
      try {
        // 🔴 Explicitly enable camera & mic
        await call.camera.enable();
        await call.microphone.enable();

        // Attach local preview
        if (call.camera.state.mediaStream && videoRef.current) {
          videoRef.current.srcObject =
            call.camera.state.mediaStream;
        }
      } catch (err) {
        console.error("Camera enable failed", err);
      }
    }

    enableCamera();
  }, [call]);

  return (
    <div style={{ padding: 20 }}>
      <h1>📞 Caller</h1>

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: 400,
          height: 300,
          background: "black",
        }}
      />

      <p>If you see yourself here, camera is ON.</p>
    </div>
  );
}

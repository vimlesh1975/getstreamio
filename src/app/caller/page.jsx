"use client";

import { useEffect, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  CallControls,
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

      await call.join({
        create: true,
        video: true,
        audio: true,
      });

      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <p>Joining as caller…</p>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <h1>📞 Caller</h1>
        <CallControls />
      </StreamCall>
    </StreamVideo>
  );
}

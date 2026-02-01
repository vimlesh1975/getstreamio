"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  StreamVideo,
  StreamCall,
  CallControls,
  SpeakerLayout,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";

export default function CallPage() {
  const params = useSearchParams();
  const userId = params.get("user") || "guest";

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    let active = true;

    (async () => {
      const streamClient = await createStreamClient(userId);
      const callInstance = streamClient.call("default", "room-1");

      await callInstance.join({ create: true });

      if (active) {
        setClient(streamClient);
        setCall(callInstance);
      }
    })();

    return () => {
      active = false;
      call?.leave();
      client?.disconnectUser?.();
    };
  }, [userId]);

  if (!client || !call) return <p>Joining call…</p>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <SpeakerLayout />
        <CallControls />
      </StreamCall>
    </StreamVideo>
  );
}

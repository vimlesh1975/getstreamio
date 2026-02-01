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
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    (async () => {
      const streamClient = await createStreamClient(userId);
      const callInstance = streamClient.call("default", "room-1");

      await callInstance.join({ create: true });

      setClient(streamClient);
      setCall(callInstance);
    })();

    return () => {
      call?.leave();
      client?.disconnectUser?.();
    };
  }, []);

  // 🔴 Start RTMP (HOST ACTION)
  async function startRTMP() {
    await fetch("/api/start-rtmp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callId: "room-1",

        // 👉 change this to YouTube / Facebook later
        rtmpUrl: "rtmp://localhost/live",
        streamKey: "stream",
      }),
    });

    setBroadcasting(true);
    alert("RTMP Broadcast Started");
  }

  if (!client || !call) return <p>Joining call…</p>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        {/* VIDEO LAYOUT */}
        <SpeakerLayout />

        {/* DEFAULT CALL CONTROLS */}
        <CallControls />

        {/* 🔴 RTMP BUTTON */}
        <div
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 1000,
          }}
        >
          {!broadcasting ? (
            <button
              onClick={startRTMP}
              style={{
                padding: "10px 16px",
                background: "red",
                color: "white",
                border: "none",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              🔴 Start Broadcast
            </button>
          ) : (
            <span style={{ color: "red", fontWeight: "bold" }}>
              🔴 LIVE
            </span>
          )}
        </div>
      </StreamCall>
    </StreamVideo>
  );
}

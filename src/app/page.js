"use client";

import { useEffect, useRef, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  useCall,
  useCallStateHooks,
  useParticipantVideoTrack,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";

export default function HostPage() {
  const userId = "host";
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");

      // Host joins immediately, no media
      await call.join({
        create: false,
        video: false,
        audio: false,
      });

      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <p>Loading host…</p>;

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
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  const [accepted, setAccepted] = useState(false);

  // Enable / disable host camera
  useEffect(() => {
    if (!call) return;

    if (!accepted) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [call, accepted]);

  const hasCaller = participants.some(p => !p.isLocal);

  const local = participants.find(p => p.isLocal);
  const remote = participants.find(p => !p.isLocal);

  if (!accepted) {
    return (
      <div style={{ padding: 20 }}>
        <h1>🎧 Host</h1>
        <button
          onClick={() => setAccepted(true)}
          disabled={!hasCaller}
        >
          {hasCaller ? "✅ Accept Call" : "Waiting for call…"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🎥 Host + Caller</h1>

      <div style={{ display: "flex", gap: 20 }}>
        {local && <VideoTile participant={local} muted />}
        {remote ? (
          <VideoTile participant={remote} />
        ) : (
          <p>Waiting for caller video…</p>
        )}
      </div>
    </div>
  );
}

function VideoTile({ participant, muted }) {
  const videoRef = useRef(null);

  const { videoTrack } = useParticipantVideoTrack(
    participant.sessionId
  );

  useEffect(() => {
    if (!videoTrack || !videoRef.current) return;

    const stream = new MediaStream([videoTrack]);
    videoRef.current.srcObject = stream;
  }, [videoTrack]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      style={{
        width: 400,
        height: 300,
        background: "black",
      }}
    />
  );
}

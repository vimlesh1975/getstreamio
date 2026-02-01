"use client";

import { useEffect, useRef, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";

export default function ProgramUI() {
  const videoRef = useRef(null);

  const { useParticipants, useCallCustomData } = useCallStateHooks();
  const participants = useParticipants();
  const custom = useCallCustomData();

  const liveUserId = custom?.liveUserId;
  const liveParticipant = participants.find(
    (p) => p.userId === liveUserId
  );

  useEffect(() => {
    if (liveParticipant?.videoStream && videoRef.current) {
      videoRef.current.srcObject = liveParticipant.videoStream;
    }
  }, [liveParticipant]);

  if (!liveParticipant) {
    return <h1>Waiting for LIVE source…</h1>;
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

"use client";

import { Suspense, useEffect, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  ParticipantView,
  useCall,
  useCallStateHooks,
  SfuModels
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";
import { useSearchParams } from "next/navigation";

export const dynamic = 'force-dynamic';

export default function HostOutputPage() {
  return (
    <Suspense fallback={<div style={{ background: 'black', height: '100vh', width: '100vw' }} />}>
      <HostLoader />
    </Suspense>
  );
}

function HostLoader() {
  const params = useSearchParams();
  const roomid = params.get("room");
  const userId = `Out-${roomid}`;

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", roomid);

      // Join silently
      await call.join({ create: false, video: false, audio: false });

      setClient(c);
      setCall(call);
    })();
  }, [userId, roomid]);

  if (!client || !call) return null;

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

  const screenShareParticipant = participants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE)
  );


  useEffect(() => {
    call.camera.disable();
    call.microphone.disable();

    // Auto-refresh logic you asked for earlier
    const unsubscribe = call.on('call.ended', () => {
      window.location.reload();
    });
    return () => unsubscribe();
  }, [call]);

  // 🔍 FIND THE HOST: Search participants for the one with 'admin' or 'host' role
  // Usually, your dashboard user has a specific ID or role
  const hostParticipant = participants.find(
    (p) => p.role === 'admin' || p.role === 'host' || p.userId.toLowerCase().includes('host')
  );

  return (
    <>
      <style jsx global>{`
  html, body { 
    margin: 0; 
    padding: 0; 
    width: 100vw; 
    height: 100vh; 
    overflow: hidden; 
    background: black; 
  }

  /* 1. Target the SDK containers to ensure they don't restrict size */
  .str-video__participant-view,
  .str-video__video-container,
  .str-video__participant-view__video {
    width: 100vw !important;
    height: 100vh !important;
    max-width: none !important;
    max-height: none !important;
  }

  /* 2. FORCE the video element to stretch */
  video { 
    width: 100vw !important; 
    height: 100vh !important; 
    object-fit: fill !important; /* 👈 Changed from 'cover' to 'fill' */
    transform: scaleX(1) !important; /* Ensures no mirroring is applied */
    display: block !important;
  }

  /* Hide SDK UI elements */
  :global(.str-video__participant-details),
  :global(.str-video__participant-view__info) { 
    display: none !important; 
  }
`}</style>

      {!hostParticipant ? (
        <div style={{ width: "100vw", height: "100vh", display: "grid", placeItems: "center", background: "black", color: "white", fontSize: 24 }}>
          Searching for Host…
        </div>
      ) : (
        <ParticipantView
          participant={hostParticipant}
          trackType={(screenShareParticipant?.userId === hostParticipant.userId) ? 'screenShareTrack' : 'videoTrack'} // 👈 Forces the switch

          drawParticipantInfo={false}
        />
      )}
    </>
  );
}
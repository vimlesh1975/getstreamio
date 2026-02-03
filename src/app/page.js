"use client";

import { useEffect, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  ParticipantView,
  useCall,
  useCallStateHooks,

} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";

function formatJoinedAt(joinedAt) {
  if (!joinedAt?.seconds) return "-";
  const ms =
    Number(joinedAt.seconds) * 1000 +
    Math.floor(Number(joinedAt.nanos || 0) / 1e6);
  return new Date(ms).toLocaleString();
}

function ParticipantTable({ participant }) {
  if (!participant) return null;

  return (
    <table
      style={{
        borderCollapse: "collapse",
        width: "100%",
        maxWidth: 700,
        fontSize: 14,
        background: "#111",
        color: "#fff",
      }}
    >
      <tbody>
        <Row label="User ID" value={participant.userId} />
        <Row label="Session ID" value={participant.sessionId} />
        <Row label="Local Participant" value={String(participant.isLocalParticipant)} />
        <Row label="Roles" value={participant.roles?.join(", ")} />
        <Row label="Connection Quality" value={participant.connectionQuality} />
        <Row label="Is Speaking" value={String(participant.isSpeaking)} />
        <Row label="Dominant Speaker" value={String(participant.isDominantSpeaker)} />
        <Row label="Audio Level" value={participant.audioLevel} />
        <Row
          label="Joined At"
          value={formatJoinedAt(participant.joinedAt)}
        />
        <Row
          label="Video Resolution"
          value={
            participant.videoDimension
              ? `${participant.videoDimension.width} × ${participant.videoDimension.height}`
              : "-"
          }
        />
        <Row
          label="Published Tracks"
          value={JSON.stringify(participant.publishedTracks)}
        />
      </tbody>
    </table>
  );
}

function Row({ label, value }) {
  return (
    <tr>
      <td
        style={{
          border: "1px solid #333",
          padding: "6px 10px",
          fontWeight: "bold",
          width: 220,
          background: "#1b1b1b",
        }}
      >
        {label}
      </td>
      <td
        style={{
          border: "1px solid #333",
          padding: "6px 10px",
          wordBreak: "break-all",
        }}
      >
        {value}
      </td>
    </tr>
  );
}



export default function HostPage() {
  const userId = "host";
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);


  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");

      // Host joins early (no media)
      await call.join({ video: false, audio: false });

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

  async function setLiveIndex(index) {
    await fetch("/api/set-live-index", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liveIndex: index }),
    });
  }




  // Enable host camera only after accept
  useEffect(() => {
    if (!accepted) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [call, accepted]);

  const callers = [...participants];
  const hasCaller = callers.length > 0;

  if (!accepted) {
    return (
      <div style={{ padding: 20 }}>
        <h1>🎧 Host</h1>
        <button
          disabled={!hasCaller}
          onClick={() => setAccepted(true)}
        >
          {hasCaller ? "✅ Accept Call" : "Waiting for call…"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>🎥 Host Control</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>

        {callers.map((caller, index) => (

          <div
            key={caller.sessionId}
            style={{
              width: 300,
              textAlign: "center",
              border: '2px solid red'
            }}
          >
            <h3>{caller.userId}</h3>
            <ParticipantView
              participant={caller}
              muted
              style={{
                width: 300,
                height: 200,
                background: "black",
                border: "2px solid #444",
              }}
            />
            <ParticipantTable participant={caller} />
            <button
              style={{ marginLeft: 10 }}
              onClick={() => setLiveIndex(index)}
            >
              TAKE LIVE {index}
            </button>
            {/* <label>{JSON.stringify(caller)}</label> */}
          </div>


        ))}

      </div>
    </div>
  );
}

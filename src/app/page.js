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

const endpoint = async (str) => {
  const requestOptions = {
    method: "POST",
    headers: {
      "Content-Type": "application/json", // Specify the content type as JSON
    },
    body: JSON.stringify(str), // Convert the data to JSON format
  };
  fetch("/api/casparcg", requestOptions);
};

function formatJoinedAt(joinedAt) {
  if (!joinedAt?.seconds) return "-";
  const ms =
    Number(joinedAt.seconds) * 1000 +
    Math.floor(Number(joinedAt.nanos || 0) / 1e6);
  return new Date(ms).toLocaleString();
}

const takeonchanel = () => {

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

  // 🔑 MULTI-PROGRAM SWITCH (SERVER API)
  async function setLive(programKey, userId) {
    await fetch("/api/set-live-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programKey,
        liveUserId: userId,
      }),
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

  // 🚫 Hide program viewers
  const visibleCallers = participants.filter(
    (p) =>
      !p.userId.startsWith("program")
  );

  const hasCaller = visibleCallers.length > 0;

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
        {visibleCallers.map((caller) => (
          <div
            key={caller.sessionId}
            style={{
              width: 300,
              textAlign: "center",
              border: "2px solid red",
              padding: 8,
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

            {/* 🎬 PROGRAM ROUTING */}
            {["program1", "program2", "program3", "program4"].map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setLive(p, caller.userId)}
                  style={{
                    display: "block",
                    width: "100%",
                    marginTop: 4,
                  }}
                >
                  TAKE LIVE → {p.toUpperCase()}
                </button>
              )
            )}
          </div>
        ))}
      </div>

      {/* 🎥 CASPARCG TRIGGER */}
      <button
        style={{ marginTop: 20 }}
        onClick={() => {
          endpoint({
            action: "endpoint",
            command: `play 1-1 [html] ${window.location.origin}/program?out=1`,
          });
        }}
      >
        Start Caspar (Program 1)
      </button>

      <button
        style={{ marginTop: 20 }}
        onClick={() => {
          endpoint({
            action: "endpoint",
            command: `play 2-1 [html] ${window.location.origin}/program?out=2`,
          });
        }}
      >
        Start Caspar (Program 2)
      </button>


      <button
        style={{ marginTop: 20 }}
        onClick={() => {
          endpoint({
            action: "endpoint",
            command: `play 3-1 [html] ${window.location.origin}/program?out=3`,
          });
        }}
      >
        Start Caspar (Program 3)
      </button>

      <button
        style={{ marginTop: 20 }}
        onClick={() => {
          endpoint({
            action: "endpoint",
            command: `play 3-1 [html] ${window.location.origin}/program?out=4`,
          });
        }}
      >
        Start Caspar (Program 4)
      </button>
    </div>
  );
}

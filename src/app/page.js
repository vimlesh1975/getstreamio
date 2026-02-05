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
function ProgramPreviewGrid() {
  const { useParticipants, useCallCustomData } =
    useCallStateHooks();

  const participants = useParticipants();
  const custom = useCallCustomData();

  const programs = custom?.programs || {};

  const getParticipant = (userId) =>
    participants.find((p) => p.userId === userId);

  return (
    <div style={{ marginTop: 20 }}>
      <h3>🎬 Program Preview</h3>

      <div style={{ display: "flex", gap: 12 }}>
        {["program1", "program2", "program3", "program4"].map(
          (key) => {
            const userId = programs[key];
            const participant = getParticipant(userId);

            return (
              <div
                key={key}
                style={{
                  width: 160,
                  background: "#000",
                  border: "2px solid #333",
                  padding: 4,
                }}
              >
                <div
                  style={{
                    color: "#fff",
                    fontSize: 12,
                    textAlign: "center",
                    marginBottom: 4,
                  }}
                >
                  {key.toUpperCase()}
                </div>

                {participant ? (
                  <ParticipantView
                    participant={participant}
                    muted
                    style={{
                      width: 152,
                      height: 90,
                      background: "black",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 152,
                      height: 90,
                      display: "grid",
                      placeItems: "center",
                      color: "#888",
                      fontSize: 12,
                    }}
                  >
                    — EMPTY —
                  </div>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
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

// ... (rest of your imports and helper functions remain the same)

function HostInner() {
  const call = useCall();
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();
  const [accepted, setAccepted] = useState(false);

  async function setLive(programKey, userId) {
    await fetch("/api/set-live-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programKey, liveUserId: userId }),
    });
  }

  useEffect(() => {
    if (!accepted) {
      call.camera.disable();
      call.microphone.disable();
    } else {
      call.camera.enable();
      call.microphone.enable();
    }
  }, [call, accepted]);

  const visibleCallers = participants.filter((p) => !p.userId.startsWith("program"));
  const hasCaller = visibleCallers.length > 0;

  if (!accepted) {
    return (
      <div style={{ padding: 20 }}>
        <h1>🎧 Host</h1>
        <button disabled={!hasCaller} onClick={() => setAccepted(true)}>
          {hasCaller ? "✅ Accept Call" : "Waiting for call…"}
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, background: "#000", minHeight: "100vh", color: "#fff" }}>
      <h1>🎥 Host Control</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 20 }}>
        {visibleCallers.map((caller) => (
          <div
            key={caller.sessionId}
            style={{
              width: 320,
              textAlign: "center",
              border: "1px solid #333",
              borderRadius: "8px",
              padding: 10,
              background: "#111",
              position: "relative",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <h3 style={{ margin: 0, fontSize: 16 }}>{caller.userId}</h3>
              <span style={{ color: caller.isSpeaking ? "#4caf50" : "#666", fontSize: 12 }}>
                {caller.isSpeaking ? "● SPEAKING" : "SILENT"}
              </span>
            </div>

            <div style={{ position: "relative", width: 300, height: 200, overflow: "hidden", borderRadius: 4 }}>
              <ParticipantView
                participant={caller}
                muted
                style={{ width: "100%", height: "100%", background: "black" }}
              />

              {/* 🎤 HOST-SIDE AUDIO BAR (Overlayed on caller video) */}
              <div className="host-audio-monitor">
                <div
                  className="host-audio-fill"
                  style={{
                    // High sensitivity for PC monitoring
                    width: `${Math.min(caller.audioLevel * 500, 100)}%`,
                    background: caller.audioLevel > 0.02 ? "#4caf50" : "#555",
                    boxShadow: caller.audioLevel > 0.02 ? "0 0 10px #4caf50" : "none"
                  }}
                />
              </div>
            </div>

            {/* 🎬 PROGRAM ROUTING */}
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
              {["program1", "program2", "program3", "program4"].map((p) => (
                <button
                  key={p}
                  onClick={() => setLive(p, caller.userId)}
                  style={{
                    padding: "6px",
                    fontSize: "11px",
                    cursor: "pointer",
                    background: "#222",
                    color: "white",
                    border: "1px solid #444",
                    borderRadius: "4px"
                  }}
                >
                  TAKE {p.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ProgramPreviewGrid />

      {/* CASPAR CONTROLS */}
      <div style={{ marginTop: 30, display: "flex", gap: 10 }}>
        {[1, 2, 3, 4].map(num => (
          <button
            key={num}
            onClick={() => endpoint({
              action: "endpoint",
              command: `play ${num}-1 [html] ${window.location.origin}/program?out=${num}`,
            })}
          >
            Start Caspar (P{num})
          </button>
        ))}
      </div>

      <style jsx>{`
        .host-audio-monitor {
          position: absolute;
          bottom: 10px;
          left: 10px;
          right: 10px;
          height: 6px;
          background: rgba(0,0,0,0.5);
          border-radius: 3px;
          border: 1px solid rgba(255,255,255,0.1);
          overflow: hidden;
        }
        .host-audio-fill {
          height: 100%;
          transition: width 0.05s linear;
        }
      `}</style>
    </div>
  );
}
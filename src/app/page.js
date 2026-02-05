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

/**
 * API utility to trigger CasparCG actions
 */
const endpoint = async (str) => {
  const requestOptions = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(str),
  };
  fetch("/api/casparcg", requestOptions);
};

/**
 * Format timestamp for the info table
 */
function formatJoinedAt(joinedAt) {
  if (!joinedAt?.seconds) return "-";
  const ms =
    Number(joinedAt.seconds) * 1000 +
    Math.floor(Number(joinedAt.nanos || 0) / 1e6);
  return new Date(ms).toLocaleString();
}

/**
 * Debug table for participant data (Optional use)
 */
function ParticipantTable({ participant }) {
  if (!participant) return null;
  return (
    <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 12, background: "#111", color: "#fff", marginTop: 10 }}>
      <tbody>
        <Row label="User ID" value={participant.userId} />
        <Row label="Audio Level" value={participant.audioLevel.toFixed(4)} />
        <Row label="Speaking" value={String(participant.isSpeaking)} />
      </tbody>
    </table>
  );
}

function Row({ label, value }) {
  return (
    <tr>
      <td style={{ border: "1px solid #333", padding: "4px", fontWeight: "bold", background: "#1b1b1b" }}>{label}</td>
      <td style={{ border: "1px solid #333", padding: "4px" }}>{value}</td>
    </tr>
  );
}

/**
 * Previews for the 4 Program Channels
 */
function ProgramPreviewGrid() {
  const { useParticipants, useCallCustomData } = useCallStateHooks();
  const participants = useParticipants();
  const custom = useCallCustomData();
  const programs = custom?.programs || {};

  const getParticipant = (userId) => participants.find((p) => p.userId === userId);

  return (
    <div style={{ marginTop: 30, borderTop: "1px solid #333", paddingTop: 20 }}>
      <h3>🎬 Program Previews</h3>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        {["program1", "program2", "program3", "program4"].map((key) => {
          const userId = programs[key];
          const participant = getParticipant(userId);
          return (
            <div key={key} style={{ width: 180, background: "#000", border: "2px solid #222", padding: 4, borderRadius: 8 }}>
              <div style={{ color: "#888", fontSize: 10, textAlign: "center", marginBottom: 4 }}>{key.toUpperCase()}</div>
              <div style={{ height: 100, background: "#050505", borderRadius: 4, overflow: "hidden" }}>
                {participant ? (
                  <ParticipantView participant={participant} muted drawParticipantInfo={false} style={{ width: "100%", height: "100%" }} />
                ) : (
                  <div style={{ height: "100%", display: "grid", placeItems: "center", fontSize: 10, color: "#333" }}>OFF AIR</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Main Host Page Export
 */
export default function HostPage() {
  const userId = "host";
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");
      await call.join({ video: false, audio: false });
      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <div style={{ background: "#000", height: "100vh", color: "white", padding: 20 }}>Initializing Host...</div>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <HostInner />
      </StreamCall>
    </StreamVideo>
  );
}

/**
 * Internal logic for the Host Monitor
 */
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
      call?.camera.disable();
      call?.microphone.disable();
    } else {
      call?.camera.enable();
      call?.microphone.enable();
    }
  }, [call, accepted]);

  const visibleCallers = participants.filter((p) => !p.userId.startsWith("program") && p.userId !== "host");
  const hasCaller = visibleCallers.length > 0;

  if (!accepted) {
    return (
      <div style={{ padding: 20, background: "#000", height: "100vh", color: "white", display: "grid", placeItems: "center" }}>
        <div style={{ textAlign: "center" }}>
          <h1 style={{ fontSize: "3rem", marginBottom: "20px" }}>🎧 Monitor</h1>
          <button
            style={{ padding: "20px 50px", fontSize: "20px", borderRadius: "50px", background: "#0070f3", color: "white", border: "none", cursor: "pointer", fontWeight: "bold" }}
            disabled={!hasCaller}
            onClick={() => setAccepted(true)}
          >
            {hasCaller ? "✅ START SESSION" : "WAITING FOR CALLERS..."}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, background: "#000", minHeight: "100vh", color: "#fff", fontFamily: "sans-serif" }}>
      <header style={{ display: "flex", justifyContent: "space-between", marginBottom: 30 }}>
        <h1 style={{ margin: 0, color: "#555" }}>🎥 <span style={{ color: "#fff" }}>GALLERY</span> CONTROL</h1>
        <div style={{ background: "#111", padding: "10px 20px", borderRadius: "8px", border: "1px solid #222" }}>
          Active Callers: {visibleCallers.length}
        </div>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 25 }}>
        {visibleCallers.map((caller) => (
          <div key={caller.sessionId} className="caller-card">

            {/* Header: ID is strictly here */}
            <div className="card-header">
              <span className="user-id-label">{caller.userId}</span>
              <div className={`audio-active-dot ${caller.isSpeaking ? "on" : ""}`} />
            </div>

            <div className="video-viewport">
              {/* ParticipantView - Completely cleaned of overlays */}
              <ParticipantView
                participant={caller}
                muted
                drawParticipantInfo={false}
                drawParticipantName={false}
                style={{ width: "100%", height: "100%" }}
              />

              {/* 🎤 INTEGRATED VU METER */}
              <div className="vu-container">
                <div
                  className="vu-bar"
                  style={{
                    width: `${Math.min(caller.audioLevel * 500, 100)}%`,
                    background: caller.audioLevel > 0.01 ? "#4caf50" : "#333",
                  }}
                />
              </div>
            </div>

            {/* ROUTING BUTTONS */}
            <div className="take-grid">
              {["program1", "program2", "program3", "program4"].map((p) => (
                <button key={p} onClick={() => setLive(p, caller.userId)} className="take-button">
                  TAKE {p.slice(-1)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <ProgramPreviewGrid />

      {/* CASPAR TRIGGERS */}
      <div style={{ marginTop: 40, borderTop: "1px solid #222", paddingTop: 20 }}>
        <p style={{ color: "#666", fontSize: 12 }}>CASPARCG MASTER CONTROLS</p>
        <div style={{ display: "flex", gap: 10 }}>
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              className="caspar-btn"
              onClick={() => endpoint({
                action: "endpoint",
                command: `play ${num}-1 [html] ${window.location.origin}/program?out=${num}`,
              })}
            >
              Init Caspar Ch {num}
            </button>
          ))}
        </div>
      </div>

      <style jsx>{`
        /* 🚫 GLOBAL OVERRIDE: Remove UserID from inside video */
        :global(.str-video__participant-details),
        :global(.str-video__participant-view__info),
        :global(.str-video__participant-view__name-area) {
          display: none !important;
          visibility: hidden !important;
        }

        .caller-card {
          width: 320px;
          background: #0a0a0a;
          border-radius: 12px;
          border: 1px solid #222;
          padding: 10px;
          transition: border-color 0.3s;
        }
        .caller-card:hover { border-color: #444; }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 2px 10px 2px;
        }
        .user-id-label {
          font-weight: bold;
          font-size: 13px;
          letter-spacing: 0.5px;
          color: #0070f3;
        }
        .audio-active-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #222;
          transition: 0.2s;
        }
        .audio-active-dot.on {
          background: #4caf50;
          box-shadow: 0 0 10px #4caf50;
        }

        .video-viewport {
          position: relative;
          width: 100%;
          height: 180px;
          background: #000;
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #1a1a1a;
        }

        .vu-container {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          height: 5px;
          background: rgba(0,0,0,0.9);
          z-index: 10;
        }
        .vu-bar {
          height: 100%;
          transition: width 0.05s linear;
        }

        .take-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-top: 12px;
        }
        .take-button {
          background: #111;
          color: #eee;
          border: 1px solid #333;
          padding: 10px;
          font-size: 11px;
          font-weight: bold;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .take-button:hover {
          background: #0070f3;
          border-color: #0070f3;
          transform: translateY(-1px);
        }

        .caspar-btn {
          background: #1a1a1a;
          color: #888;
          border: 1px solid #333;
          padding: 8px 15px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }
        .caspar-btn:hover { background: #333; color: white; }
      `}</style>
    </div>
  );
}
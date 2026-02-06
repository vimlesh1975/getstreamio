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

import TokenGenerator from "./components/TokenGenerator";

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

  return (<>
    <div style={{ display: 'flex' }}>
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
      <div style={{ marginTop: 30, borderTop: "1px solid #333", paddingTop: 20 }}>
        <TokenGenerator
          defaultUserId={`caller-${Date.now()}`}
          callerPath="/caller"
          onTokenGenerated={(token, userId) => {
            console.log("Token generated:", userId);
          }}
        />

      </div>
    </div>

  </>);
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
  const { useParticipants, useCallCustomData } = useCallStateHooks();
  const participants = useParticipants();
  const custom = useCallCustomData();
  const programs = custom?.programs || {};
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

  const visibleCallers = participants.filter((p) => !p.userId.startsWith("program"));
  const hasCaller = visibleCallers.length > 0;

  if (!accepted) {
    return (
      <div className="onboarding-screen">
        <div className="glass-panel">
          <h1>🎙️ Studio Monitor</h1>
          <p>Ready to manage the broadcast gallery?</p>
          <button
            className="start-btn"
            disabled={!hasCaller}
            onClick={() => setAccepted(true)}
          >
            {hasCaller ? "LAUNCH CONTROL ROOM" : "WAITING FOR SIGNAL..."}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="main-header">
        <div className="brand">
          <div className="live-indicator">REC</div>
          <h1>GALLERY <span>CONTROL</span></h1>
        </div>
        <div className="stats-badge">
          CONNECTED SOURCES: {visibleCallers.length}
        </div>
      </header>

      <div className="gallery-grid">
        {visibleCallers.map((caller) => {
          // Check if this caller is currently live in ANY program
          const isLive = Object.values(programs).includes(caller.userId);

          return (
            <div key={caller.sessionId} className={`caller-card ${isLive ? 'is-live' : ''}`}>
              <div className="card-header">
                <span className="user-id-label">{caller.userId}</span>
                {isLive && <span className="live-pill">LIVE</span>}
                <div className={`audio-active-dot ${caller.isSpeaking ? "on" : ""}`} />
              </div>

              <div className="video-viewport">
                <ParticipantView
                  participant={caller}
                  muted
                  drawParticipantInfo={false}
                  style={{ width: "100%", height: "100%" }}
                />

                <div className="vu-meter-vertical">
                  <div
                    className="vu-level"
                    style={{
                      height: `${Math.min(caller.audioLevel * 400, 100)}%`,
                      backgroundColor: caller.audioLevel > 0.05 ? '#40ff5a' : '#555'
                    }}
                  />
                </div>
              </div>

              <div className="take-grid">
                {["program1", "program2", "program3", "program4"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setLive(p, caller.userId)}
                    className={`take-button ${programs[p] === caller.userId ? 'active' : ''}`}
                  >
                    PGM {p.slice(-1)}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <ProgramPreviewGrid />

      <footer className="caspar-controls">
        <h3>SYSTEM ENGINE (CASPARCG)</h3>
        <div className="caspar-grid">
          {[1, 2, 3, 4].map(num => (
            <button
              key={num}
              className="caspar-btn"
              onClick={() => endpoint({
                action: "endpoint",
                command: `play ${num}-1 [html] ${window.location.origin}/program?out=${num}`,
              })}
            >
              RESET CH {num}
            </button>
          ))}
        </div>


      </footer>

      <style jsx>{`
        /* Setup & Typography */
       :global(body) {
  margin: 0;
  background: linear-gradient(
    180deg,
    #f1f5f9 0%,
    #e5e7eb 100%
  );
  color: #0f172a;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}


    .dashboard-container {
  padding: 30px;
  min-height: 100vh;
  background: linear-gradient(
    135deg,
    #f8fafc 0%,
    #eef2f7 100%
  );
}


        /* Onboarding */
        .onboarding-screen {
          height: 100vh;
          display: grid;
          place-items: center;
          background: #090a0f;
        }
        .glass-panel {
          padding: 40px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          text-align: center;
          backdrop-filter: blur(10px);
        }
        .start-btn {
          margin-top: 20px;
          padding: 16px 40px;
          background: #0070f3;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .start-btn:hover:not(:disabled) { transform: scale(1.05); background: #0080ff; }

        /* Header */
       .main-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding-bottom: 20px;
  border-bottom: 1px solid #cbd5e1;
}

        .brand { display: flex; align-items: center; gap: 15px; }
        .brand h1 { font-size: 1.2rem; letter-spacing: 2px; margin: 0; color: #64748b; }
        .brand h1 span { color: #fff; }
        .live-indicator {
          background: #ef4444;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 0.7rem;
          font-weight: 900;
          animation: blink 2s infinite;
        }

        /* Gallery Grid */
        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 25px;
        }

       .caller-card {
  background: #ffffff;
  border-radius: 14px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 10px 25px rgba(0,0,0,0.08);
}

       .caller-card.is-live {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(239,68,68,0.4);
}


        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }
        .user-id-label { font-family: monospace; color: #94a3b8; font-size: 0.9rem; }
        .live-pill {
          background: #ef4444;
          font-size: 10px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 10px;
        }

        /* Video Area */
       .video-viewport {
  background: #020617;
  border-radius: 10px;
}

        .vu-meter-vertical {
          position: absolute;
          right: 8px;
          top: 10px;
          bottom: 10px;
          width: 4px;
          background: rgba(0,0,0,0.5);
          border-radius: 2px;
          display: flex;
          flex-direction: column-reverse;
        }
        .vu-level { width: 100%; border-radius: 2px; transition: height 0.1s ease; }

        /* Controls */
        .take-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin-top: 15px;
        }
       .take-button {
  background: #f1f5f9;
  border: 1px solid #cbd5e1;
  color: #0f172a;
}
.take-button:hover {
  background: #e2e8f0;
}
.take-button.active {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}


        /* Footer & Caspar */
       .caspar-controls {
  margin-top: 10px;
  background: #ffffff;
  padding: 20px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  max-width:500px;
  max-height:100px;
}

        .caspar-controls h3 { font-size: 0.8rem; color: #475569; margin-bottom: 15px; }
        .caspar-grid { display: flex; gap: 10px; }
        .caspar-btn {
          background: transparent;
          border: 1px solid #334155;
          color: #64748b;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
        }
        .caspar-btn:hover { border-color: #0070f3; color: #0070f3; }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        :global(.str-video__participant-details) { display: none !important; }
      `}</style>


    </div>
  );
}
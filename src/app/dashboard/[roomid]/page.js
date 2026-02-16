"use client";

import { useEffect, useState, use } from "react";
import {
  StreamVideo,
  StreamCall,
  ParticipantView,
  useCall,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/hoststream";

import TokenGeneratorWithDuration from '../../components/TokenGenerator';

/**
 * API utility to trigger CasparCG actions
 */
const endpoint = async (str) => {
  const requestOptions = {
    method: "POST",
    mode: 'cors', // Explicitly ask for CORS
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(str),
  };
  try {
    await fetch("http://localhost:3000/api/casparcg", requestOptions);
  } catch (e) {
    console.error("CasparCG Error:", e);
  }
};


/**
 * Previews for the 4 Program Channels
 */
function ProgramPreviewGrid({ roomid }) {
  const { useParticipants, useCallCustomData } = useCallStateHooks();
  const participants = useParticipants();
  const custom = useCallCustomData();
  const programs = custom?.programs || {};



  const getParticipant = (userId) => participants.find((p) => p.userId === userId);

  return (
    <div style={{ display: 'flex', gap: '40px', marginTop: 30, borderTop: "1px solid #cbd5e1", paddingTop: 20, }}>
      <div>
        <h3 style={{ color: '#475569', fontSize: '0.9rem', marginBottom: 15 }}>🎬 PROGRAM PREVIEWS</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", maxWidth: 850 }}>
          {["program1", "program2", "program3", "program4"].map((key, i) => {
            const userId = programs[key];
            const participant = getParticipant(userId);
            return (
              <div key={key} style={{ width: 180, background: "#000", border: "2px solid #334155", padding: 4, borderRadius: 8 }}>
                <div style={{ color: "#94a3b8", fontSize: 10, textAlign: "center", marginBottom: 4, fontWeight: 'bold' }}>{key.toUpperCase()}</div>
                <div style={{ height: 100, background: "#050505", borderRadius: 4, overflow: "hidden1" }}>
                  {participant && (<>
                    <ParticipantView participant={participant} muted drawParticipantInfo={false} style={{ width: "100%", height: "100%" }} />
                    <button style={{ color: 'black' }}

                      // Inside your ProgramPreviewGrid map
                      onClick={() => endpoint({
                        action: "endpoint",
                        // 👈 Added &room=${roomid}
                        command: `play ${i + 1}-1 [html] ${window.location.origin}/program?out=${i + 1}&room=${roomid}`,
                      })}
                    >
                      Initialise CH {i + 1}
                    </button>
                    <button onClick={() => {
                      window.open(`${window.location.origin}/program?out=${i + 1}&room=${roomid}`, "_blank")
                    }}>for HDMI</button>
                  </>)
                  }
                </div>
              </div>
            );
          })}
        </div>
      </div>



    </div>
  );
}

export default function HostPage({ params }) {
  const resolvedParams = use(params);
  const roomid = resolvedParams.roomid;
  const userId = roomid + "_host_" + Math.random().toString(36).slice(2, 8);;
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);

      const call = c.call("default", roomid);
      await call.join({ create: true, video: false, audio: false });
      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) return <div style={{ background: "#0f172a", height: "100vh", color: "white", padding: 20 }}>Initializing Host...</div>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <HostInner roomid={roomid} />
      </StreamCall>
    </StreamVideo>
  );
}

function HostInner({ roomid }) {
  const call = useCall();
  const { useParticipants, useCallCustomData } = useCallStateHooks();
  const participants = useParticipants();
  const custom = useCallCustomData();
  const programs = custom?.programs || {};
  const [accepted, setAccepted] = useState(false);

  const [showTokenGenerator, setShowTokenGenerator] = useState(false);

  async function endCallForAll() {
    try {
      await call.endCall();
    } catch (err) {
      console.error("Failed to end call", err);
    }
  }
  // Inside your HostInner component
  async function muteAllCallers() {
    try {
      // This triggers a request to the server to mute everyone except the person calling it
      await call.muteAllUsers('audio');
      console.log("Sent mute request to all participants");
    } catch (err) {
      console.error("Failed to mute all:", err);
      // alert("Permission denied: Only a host can mute all participants.");
    }
  }
  // 3. The Kick Function
  const removeUser = async (userId) => {
    if (!userId) return;
    try {
      // blocks user = kicks them out
      // await call.blockUser(userId);
      await call.kickUser({
        user_id: userId,
      });

    } catch (err) {
      console.error("Failed to remove user:", err);
      alert("Error: You might not have permission to kick users.");
    }
  };


  // Inside HostInner in your dashboard page
  async function setLive(programKey, userId) {
    await fetch("/api/set-live-user", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // 👈 Added roomid here
      body: JSON.stringify({ programKey, liveUserId: userId, roomid }),
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
          <p style={{ color: '#94a3b8' }}>Ready to manage the broadcast gallery?</p>
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
      <div style={{ marginBottom: 20, borderBottom: '1px solid #ddd', pb: 10 }}>
        <h2 style={{ margin: 0 }}>📍 STUDIO: {roomid?.replace(/_/g, " ")}</h2>
      </div>
      <span style={{ color: '#64748b' }}>DD Caller</span>  CONNECTED SOURCES: {visibleCallers.length}
      <button onClick={async () => {
        await fetch("/api/logout", { method: "POST" });
        location.href = "/";
      }}>
        Logout
      </button>

      <button
        onClick={endCallForAll}
        style={{
          background: "#ef4444",
          color: "white",
          padding: "12px 20px",
          borderRadius: 8,
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
        }}
      >
        🔴 END CALL (ALL)
      </button>
      <button
        onClick={muteAllCallers}
        style={{
          background: "#f59e0b", // Amber/Orange color
          color: "white",
          padding: "12px 20px",
          borderRadius: 8,
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
          marginLeft: "10px"
        }}
      >
        🔇 MUTE ALL GUESTS
      </button>

      <div className="gallery-grid">
        {visibleCallers.map((caller) => {
          const isLive = Object.values(programs).includes(caller.userId);
          // Enhanced volume calculation for better visibility
          const volSens = Math.sqrt(caller.audioLevel) * 100;

          return (
            <div key={caller.sessionId} className={`caller-card ${isLive ? 'is-live' : ''}`}>
              <div className="card-header">
                <span className="user-id-label">{caller.userId}</span><button onClick={() => {
                  removeUser(caller.userId);
                }}>Remove</button>{caller.roles}
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

                {/* THE VU METER */}
                <div className="vu-meter-vertical">
                  <div
                    className="vu-level"
                    style={{
                      height: `${Math.min(volSens, 100)}%`,
                      backgroundColor: caller.audioLevel > 0.005 ? '#22c55e' : '#475569'
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
      <div style={{ display: 'flex' }}>
        <div>
          <ProgramPreviewGrid roomid={roomid} />
        </div>
        <div>
          <div>
            <button onClick={() => {
              setShowTokenGenerator(!showTokenGenerator);
            }}>{showTokenGenerator ? 'Hide TokenGenerator' : 'show TokenGenerator'} </button>
          </div>
          {showTokenGenerator &&
            <div>
              <TokenGeneratorWithDuration
                roomid={roomid}
                defaultUserId={`${roomid}-${Date.now()}`}
              />
            </div>}
        </div>
      </div>


      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #f1f5f9;
          color: #0f172a;
          font-family: 'Inter', system-ui, sans-serif;
        }

        .dashboard-container {
          padding: 30px;
          min-height: 100vh;
        }

        .onboarding-screen {
          height: 100vh;
          display: grid;
          place-items: center;
          background: #0f172a;
          color: white;
        }

        .glass-panel {
          padding: 40px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          text-align: center;
          backdrop-filter: blur(12px);
        }

        .start-btn {
          margin-top: 20px;
          padding: 14px 32px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }

        .main-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid #cbd5e1;
        }

        .brand { display: flex; align-items: center; gap: 12px; }
        .live-indicator {
          background: #ef4444;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.65rem;
          font-weight: 800;
          animation: blink 2s infinite;
        }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .caller-card {
          background: white;
          padding: 15px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        }

        .caller-card.is-live {
          border: 2px solid #ef4444;
          background: #fff1f2;
        }

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .user-id-label { font-size: 0.8rem; font-weight: 600; color: #64748b; }

        .audio-active-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #cbd5e1;
        }
        .audio-active-dot.on { background: #22c55e; box-shadow: 0 0 8px #22c55e; }

        .video-viewport {
          background: #000;
          aspect-ratio: 16/9;
          border-radius: 8px;
          overflow: hidden;
          position: relative; /* CRITICAL for absolute children */
        }

        .vu-meter-vertical {
          position: absolute;
          right: 10px;
          top: 10px;
          bottom: 10px;
          width: 6px;
          background: rgba(0,0,0,0.6);
          border-radius: 10px;
          display: flex;
          flex-direction: column-reverse;
          z-index: 10; /* Ensures it's above the video */
          border: 1px solid rgba(255,255,255,0.1);
        }

        .vu-level {
          width: 100%;
          border-radius: 10px;
          transition: height 0.05s ease, background-color 0.2s;
        }

        .take-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
          margin-top: 12px;
        }

        .take-button {
          padding: 8px;
          font-size: 0.75rem;
          font-weight: bold;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          cursor: pointer;
        }

        .take-button.active {
          background: #ef4444;
          color: white;
          border-color: #ef4444;
        }

        .caspar-footer {
          margin-top: 40px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          max-width:550px
        }
          button:hover {
  background-color: #000000 !important;
  color: #ffffff !important;
  border-color: #000000 !important;
  cursor: pointer;
  transition: all 0.2s ease;
}

        .caspar-grid { display: flex; gap: 10px; flex-wrap: wrap; }
        .caspar-btn {
          padding: 6px 12px;
          font-size: 0.7rem;
          border: 1px solid #cbd5e1;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .download-btn {
          padding: 6px 12px;
          font-size: 0.7rem;
          background: #0f172a;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        :global(.str-video__participant-details) { display: none !important; }
      `}</style>
    </div>
  );
}
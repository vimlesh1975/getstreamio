"use client";

import { useEffect, useState, use, useMemo } from "react";
import {
  StreamVideo,
  StreamCall,
  ParticipantView,
  useCall,
  useCallStateHooks,
  StreamTheme,
  CallControls,
  SfuModels,
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

  const screenShareParticipant = participants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE)
  );

  return (
    <div style={{ display: 'flex', gap: '40px', marginTop: 20, borderTop: "1px solid #cbd5e1", paddingTop: 20, }}>
      <div>
        <h3 style={{ color: '#475569', fontSize: '0.9rem', marginBottom: 15 }}>🎬 Out Preview</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", maxWidth: 850 }}>
          {["Out1", "Out2", "Out3", "Out4"].map((key, i) => {
            const userId = programs[key];
            const participant = getParticipant(userId);
            return (
              <div key={key} style={{ width: 180, background: "#000", border: "2px solid #334155", padding: 4, borderRadius: 8 }}>
                <div style={{ color: "#94a3b8", fontSize: 10, textAlign: "center", marginBottom: 4, fontWeight: 'bold' }}>{key.toUpperCase()}</div>
                <div style={{ height: 100, background: "#050505", borderRadius: 4, overflow: "hidden1" }}>
                  {participant && (<>
                    <ParticipantView
                      mirror={false}
                      participant={participant}
                      trackType={(screenShareParticipant?.userId === participant.userId) ? 'screenShareTrack' : 'videoTrack'} // 👈 Forces the switch

                      muteAudio={true}
                      drawParticipantInfo={false}
                      style={{ width: "100%", height: "100%" }} />
                    <button style={{ color: 'black' }}

                      // Inside your ProgramPreviewGrid map
                      onClick={() => endpoint({
                        action: "endpoint",
                        // 👈 Added &room=${roomid}
                        command: `play ${i + 1}-1 [html] ${window.location.origin}/program?out=${i + 1}&room=${roomid}`,
                      })}
                    >
                      Caspar CH {i + 1}
                    </button>
                    <button
                      onClick={() => {
                        const features = "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes";
                        const windowName = `HDMI_${i + 1}`;
                        window.open(
                          `${window.location.origin}/program?out=${i + 1}&room=${roomid}`,
                          windowName,
                          features
                        );
                      }}
                    >for HDMI</button>
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
  // const userId = roomid + "_host_" + Math.random().toString(36).slice(2, 8);
  // Inside HostPage
  const userId = useMemo(() => {
    return `${roomid}_host_${Math.random().toString(36).slice(2, 6)}`;
  }, [roomid]);
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);


  useEffect(() => {
    let active = true;
    (async () => {
      const c = await createStreamClient(userId);
      if (!active) return;

      const call = c.call("default", roomid);

      // We set the role to 'admin' to ensure they have permissions 
      // to kick others or mute all.
      await call.getOrCreate({
        data: {
          members: [{ user_id: userId, role: 'admin' }]
        }
      });

      await call.join({ create: true, video: false, audio: false });

      setClient(c);
      setCall(call);
    })();

    return () => {
      active = false;
      // Cleanup to prevent double-mounting issues
      client?.disconnectUser();
    };
  }, [userId, roomid]);
  if (!client || !call) return <div style={{ background: "#0f172a", height: "100vh", color: "white", padding: 20 }}>Initializing Host...</div>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <StreamTheme>
          <HostInner roomid={roomid} />
          <CallControls />
        </StreamTheme>

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
  const [muteAudio, setMuteAudio] = useState(true);



  async function endCallForAll() {
    try {
      await call.endCall();
    } catch (err) {
      console.error("Failed to end call", err);
    }
  }

  const removeUser = async (userId) => {
    if (!userId) return;
    try {
      await call.kickUser({
        user_id: userId,
      });

    } catch (err) {
      console.error("Failed to remove user:", err);
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

  useEffect(() => {
    console.log(call.currentUserId);
    // 1. Identify "Ghost" admins (other users starting with admin_ that aren't ME)
    const ghostAdmins = participants.filter(
      (p) => p.userId.includes(roomid + "_host") && p.userId !== call.currentUserId
    );

    // 2. If any exist, kick them automatically
    if (ghostAdmins.length > 0) {
      console.log(`Cleaning up ${ghostAdmins.length} ghost session(s)...`);

      ghostAdmins.forEach(async (ghost) => {
        try {
          await call.kickUser({ user_id: ghost.userId });
          console.log(`Successfully removed ghost: ${ghost.userId}`);
        } catch (err) {
          console.error("Failed to auto-remove ghost admin:", err);
        }
      });
    }
  }, []);

  const visibleCallers = participants.filter((p) => !p.userId.startsWith("Out"));
  const hasCaller = visibleCallers.length > 0;

  const screenShareParticipant = participants.find((p) =>
    p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE)
  );

  if (!accepted) {
    return (
      <div className="onboarding-screen">
        <div className="glass-panel">
          <h1>GetStream Dashborad</h1>
          <button onClick={() => {
            window.open("/decklink-init.html", "_blank")
          }}>Open Decklink Selector</button>
          <button
            className="start-btn"
            disabled={!hasCaller}
            onClick={() => setAccepted(true)}
          >
            {hasCaller ? "Open Dasboard" : "WAITING FOR SIGNAL..."}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div style={{ marginBottom: 20, borderBottom: '1px solid #ddd', pb: 10 }}>
        <h2 style={{ margin: 0 }}>STUDIO: {roomid?.replace(/_/g, " ")}</h2>
      </div>
      <button
        style={{
          background: "#0023a1",
          color: "white",
          padding: "12px 20px",
          borderRadius: 8,
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
          marginLeft: "10px"
        }}
        onClick={async () => {
          await fetch("/api/logout", { method: "POST" });
          location.href = "/";
        }}>
        Logout
      </button>

      <button
        onClick={endCallForAll}
        style={{
          background: "#0023a1",
          color: "white",
          padding: "12px 20px",
          borderRadius: 8,
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
          marginLeft: "10px"
        }}
      >
        🔴 END CALL (ALL)
      </button>
      <button
        onClick={() => {
          setMuteAudio(val => !val);
        }}
        style={{
          background: "#0023a1",
          color: "white",
          padding: "12px 20px",
          borderRadius: 8,
          border: "none",
          fontWeight: "bold",
          cursor: "pointer",
          marginLeft: "10px"
        }}
      >
        {muteAudio ? "UnMute" : "Mute"}
      </button>

      <div className="gallery-grid">



        {visibleCallers.map((caller, i) => {
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
                  key={i}
                  participant={caller}
                  trackType={(screenShareParticipant?.userId === caller.userId) ? 'screenShareTrack' : 'videoTrack'} // 👈 Forces the switch

                  mirror={false}
                  muteAudio={caller.userId.includes('host') ? true : muteAudio}
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
                {["Out1", "Out2", "Out3", "Out4"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setLive(p, caller.userId)}
                    className={`take-button ${programs[p] === caller.userId ? 'active' : ''}`}
                  >
                    OUT {p.slice(-1)}
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
            <button onClick={() => setShowTokenGenerator(!showTokenGenerator)}>
              {showTokenGenerator ? '✖️ Close Generator' : '🎫 Invite Guest'}
            </button>

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


      <div style={{
        display: 'flex',
        gap: '20px',
        padding: '20px',
        background: '#0f172a',
        justifyContent: 'center',
        maxWidth: 600,
        marginTop: 25,
        borderRadius: '16px' // Optional: smooths out the panel edges
      }}>
        {[2, 3, 4].map((num) => {
          // Determine route name once at the top of the map
          const route = num === 2 ? 'twoshot' : num === 3 ? 'threeshot' : 'fourshot';

          return (
            <div key={num} style={{
              width: '180px',
              height: '180px',
              background: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '12px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              {/* Top Section: Local Window Preview */}
              <div style={{ flex: 1, display: 'flex' }}>
                <button
                  onClick={() => {
                    const features = "width=1280,height=720,menubar=no,toolbar=no,location=no,status=no,resizable=yes";
                    window.open(
                      `${window.location.origin}/${route}?out=${1}&room=${roomid}`,
                      `shot_${num}`,
                      features
                    );
                  }}
                  onMouseOver={(e) => e.currentTarget.style.background = '#334155'}
                  onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                  style={{
                    width: '100%', // Changed to 100% for better click area
                    background: 'transparent',
                    border: 'none',
                    color: 'white',
                    fontWeight: '800',
                    fontSize: '1.1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'background 0.2s'
                  }}
                >
                  <span style={{ fontSize: '1.5rem' }}>📺</span>
                  {num} SHOT
                </button>
              </div>

              {/* Bottom Section: CasparCG AMCP Trigger */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                height: '45px',
                background: '#000',
                borderTop: '1px solid #334155'
              }}>
                {['CH1', 'CH2', 'CH3', 'CH4'].map((label, i) => (
                  <button
                    key={label}
                    onClick={() => {
                      endpoint({
                        action: "endpoint",
                        command: `PLAY ${i + 1}-1 [HTML] "${window.location.origin}/${route}?out=${i + 1}&room=${roomid}"`,
                      });
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = '#ef4444'; // Red for "On Air" feel
                      e.currentTarget.style.color = '#fff';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = '#0f172a';
                      e.currentTarget.style.color = '#94a3b8';
                    }}
                    style={{
                      background: '#0f172a',
                      border: '1px solid #1e293b',
                      color: '#94a3b8',
                      fontSize: '9px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.1s'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>


      <style jsx>{`
        :global(body) {
          margin: 0;
          background: #f1f5f9;
          color: #0f172a;
          font-family: 'Inter', system-ui, sans-serif;
        }
          /* 1. Target the dropdown container and menu backgrounds */
:global(.str-video__menu-container), 
:global(.str-video__generic-menu),
:global(.str-video__participant-menu) {
  background-color: #1c1f22 !important; 
  color: white !important;
  border: 1px solid rgba(255,255,255,0.1) !important;
}

/* 2. Target labels, buttons, and icons inside the menu */
:global(.str-video__menu-item),
:global(.str-video__generic-menu__item),
:global(.str-video__icon-button),
:global(.str-video__menu-item__label),
:global(.str-video__menu-item__icon) {
  color: white !important;
}

/* 3. Force SVG icons to be white */
:global(.str-video__menu-item svg) {
  fill: white !important;
  color: white !important;
}

/* 4. Fix the hover state so text stays visible */
:global(.str-video__menu-item:hover) {
  background-color: #3b82f6 !important; /* Brighter blue for visibility */
  color: white !important;
}

/* 5. Ensure button icons inside the menu are also white */
:global(.str-video__button__icon) {
  color: white !important;
  fill: white !important;
}

:global(.str-video__screen-share-overlay__button) {
    display: none !important;
}

:global(.str-video__screen-share-overlay__title){
color: white !important;}
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
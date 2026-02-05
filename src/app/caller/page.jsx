"use client";

import { useEffect, useState, useRef } from "react";
import {
  StreamVideo,
  StreamCall,
  ParticipantView,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";

export default function CallerPage() {
  const [userId] = useState(() => "caller-" + Math.random().toString(36).slice(2, 8));
  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");
      setClient(c);
      setCall(call);
    })();
  }, [userId]);

  if (!client || !call) {
    return (
      <div style={{ background: "#1a1a1a", height: "100vh", color: "white", display: "grid", placeItems: "center" }}>
        <p>Loading caller…</p>
      </div>
    );
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallerInner call={call} joined={joined} setJoined={setJoined} />
      </StreamCall>
    </StreamVideo>
  );
}

function CallerInner({ call, joined, setJoined }) {
  const {
    useParticipants,
    useLocalParticipant,
    useMicrophoneState,
    useCameraState
  } = useCallStateHooks();

  const participants = useParticipants();
  const self = useLocalParticipant();
  const host = participants.find((p) => p.userId === "host");

  // Get Mute States
  const { isMuted: micMuted } = useMicrophoneState();
  const { isMuted: camMuted } = useCameraState();

  // SDK Local Audio Level (Value between 0 and 1)
  const localAudioLevel = self?.audioLevel || 0;

  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [setupAudioLevel, setSetupAudioLevel] = useState(0);

  // 1. SETUP SCREEN LOGIC
  useEffect(() => {
    let audioContext, analyser, animationFrame, micStream;

    async function setupDevices() {
      try {
        let devices = await navigator.mediaDevices.enumerateDevices();
        if (devices.every((d) => !d.label)) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getTracks().forEach((t) => t.stop());
          devices = await navigator.mediaDevices.enumerateDevices();
        }

        const cams = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(cams);
        if (cams[0]) setSelectedDevice(cams[0].deviceId);

        micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(micStream);
        source.connect(analyser);
        analyser.fftSize = 256;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        const updateLevel = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setSetupAudioLevel(average);
          animationFrame = requestAnimationFrame(updateLevel);
        };
        updateLevel();
      } catch (err) {
        console.error("Setup failed:", err);
      }
    }

    if (!joined) setupDevices();

    return () => {
      cancelAnimationFrame(animationFrame);
      if (audioContext) audioContext.close();
      if (micStream) micStream.getTracks().forEach(t => t.stop());
    };
  }, [joined]);

  async function startCall() {
    try {
      await call.join({
        create: true,
        video: true,
        audio: true,
      });

      if (selectedDevice) {
        await call.camera.select(selectedDevice);
      }

      setJoined(true);
    } catch (e) {
      console.error("Join failed", e);
    }
  }

  // --- RENDER: SETUP SCREEN ---
  if (!joined) {
    return (
      <div style={{ padding: 30, background: "#1a1a1a", minHeight: "100vh", color: "white", fontFamily: "sans-serif" }}>
        <h2 style={{ marginBottom: 30 }}>📷 Media Setup</h2>
        <p style={{ marginBottom: 20, color: "#ccc" }}>To join your secure video call, allow access to camera and microphone. Keep your device horizontal.</p>

        <div style={{ marginBottom: 25 }}>
          <label style={{ display: "block", marginBottom: 10, color: "#aaa" }}>Select Camera</label>
          <select
            style={{ width: "100%", maxWidth: 400, padding: 12, borderRadius: 8, border: "1px solid #444", background: "#333", color: "white" }}
            value={selectedDevice}
            onChange={(e) => setSelectedDevice(e.target.value)}
          >
            {videoDevices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${d.deviceId.slice(0, 5)}`}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 40 }}>
          <label style={{ display: "block", marginBottom: 10, color: "#aaa" }}>Microphone Check</label>
          <div style={{ width: "100%", maxWidth: 400, height: 10, background: "#333", borderRadius: 5, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min((setupAudioLevel / 128) * 100, 100)}%`, background: setupAudioLevel > 30 ? "#4caf50" : "#666", transition: "width 0.1s ease" }} />
          </div>
        </div>

        <button onClick={startCall} style={{ background: "#0070f3", color: "white", border: "none", padding: "15px 40px", fontSize: 18, borderRadius: 30, cursor: "pointer", fontWeight: "bold" }}>
          📲 Enter Call
        </button>
      </div>
    );
  }

  // --- RENDER: IN-CALL SCREEN ---
  return (
    <div style={{ padding: 10, background: "black", minHeight: "100vh", color: "white", position: "relative" }}>
      <div className="video-grid">
        {/* HOST */}
        <div className="video-tile">
          <p className="label">Host</p>
          <div className="video-wrapper">
            {host ? (
              <ParticipantView participant={host} />
            ) : (
              <div className="placeholder">Waiting for host…</div>
            )}
          </div>
        </div>

        {/* SELF */}
        <div className="video-tile">
          <p className="label">You</p>
          <div className="video-wrapper">
            {self ? (
              <ParticipantView participant={self} muted />
            ) : (
              <div className="placeholder">Starting camera…</div>
            )}

            {/* 🎤 AUDIO LEVEL INDICATOR (IN-CALL) */}
            <div className="in-call-audio-meter">
              <div
                className="audio-meter-fill"
                style={{
                  // Math.pow(n, 0.4) pushes low values way up. 
                  // If level is 0.1, result is ~0.4 (40% height)
                  height: `${Math.min(Math.pow(localAudioLevel, 0.4) * 100, 100)}%`,

                  background: micMuted ? "#ff4444" : "#4caf50",
                  // Optional: Adds a glow when you are actually talking
                  boxShadow: !micMuted && localAudioLevel > 0.01 ? "0 0 10px #4caf50" : "none",
                  transition: "height 0.08s ease-out" // Fast but smooth
                }}
              />
            </div>

            {camMuted && (
              <div className="camera-off-overlay">
                <span>Camera Off</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- MUTE CONTROLS BAR --- */}
      <div className="controls-bar">
        <button
          onClick={() => call.microphone.toggle()}
          className={`control-btn ${micMuted ? "muted" : ""}`}
        >
          {micMuted ? "🎤 Unmute" : "🎤 Mute"}
        </button>

        <button
          onClick={() => call.camera.toggle()}
          className={`control-btn ${camMuted ? "muted" : ""}`}
        >
          {camMuted ? "📷 Turn On" : "📷 Stop Video"}
        </button>

        <button
          onClick={() => window.location.reload()}
          className="control-btn leave"
        >
          🚪 Leave
        </button>
      </div>

      <style jsx>{`
        .video-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: calc(100vh - 100px);
        }
        .video-tile {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          position: relative;
        }
        .label {
          margin: 5px 0;
          font-size: 14px;
          color: #888;
        }
        .video-wrapper {
          flex: 1;
          background: #111;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
        }
        .placeholder {
          display: grid; place-items: center; height: 100%; color: #444;
        }
        .camera-off-overlay {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          background: #111; display: grid; place-items: center; color: #555;
          font-weight: bold;
        }

        /* 🎤 In-Call Audio Meter Styles */
        .in-call-audio-meter {
          position: absolute;
          left: 10px;
          bottom: 10px;
          width: 6px;
          height: 150px;
          background: rgba(0,0,0,0.4);
          border-radius: 3px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.1);
          z-index: 2;
        }
        .audio-meter-fill {
          position: absolute;
          bottom: 0;
          width: 100%;
          transition: height 0.1s ease;
        }

        /* Controls Styles */
        .controls-bar {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 15px;
          background: rgba(30, 30, 30, 0.85);
          padding: 10px 20px;
          border-radius: 40px;
          backdrop-filter: blur(10px);
          border: 1px solid #333;
        }
        .control-btn {
          background: #444;
          color: white;
          border: none;
          padding: 10px 18px;
          border-radius: 20px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          transition: 0.2s;
        }
        .control-btn.muted { background: #ff4444; }
        .control-btn.leave { background: #333; border: 1px solid #555; }
        .control-btn:active { transform: scale(0.95); }

        @media (min-width: 768px) or (orientation: landscape) {
          .video-grid { flex-direction: row; }
        }
      `}</style>
    </div>
  );
}
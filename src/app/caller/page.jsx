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
  const { useParticipants, useLocalParticipant } = useCallStateHooks();
  const participants = useParticipants();
  const self = useLocalParticipant();
  const host = participants.find((p) => p.userId === "host");

  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");
  const [audioLevel, setAudioLevel] = useState(0);

  // 1. Load cameras and setup Audio Visualizer (iPad fix included)
  useEffect(() => {
    let audioContext;
    let analyser;
    let animationFrame;
    let micStream;

    async function setupDevices() {
      try {
        // iPad/Safari fix: request permission first to unlock device labels
        let devices = await navigator.mediaDevices.enumerateDevices();
        if (devices.every((d) => !d.label)) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          stream.getTracks().forEach((t) => t.stop());
          devices = await navigator.mediaDevices.enumerateDevices();
        }

        const cams = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(cams);
        if (cams[0]) setSelectedDevice(cams[0].deviceId);

        // Setup Audio Level Monitoring for Setup Screen
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
          setAudioLevel(average);
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

  // 2. Start Call
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
            <div style={{ height: "100%", width: `${Math.min((audioLevel / 128) * 100, 100)}%`, background: audioLevel > 30 ? "#4caf50" : "#666", transition: "width 0.1s ease" }} />
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
    <div style={{ padding: 10, background: "black", minHeight: "100vh", color: "white" }}>
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
          </div>
        </div>
      </div>

      <style jsx>{`
        .video-grid {
          display: flex;
          flex-direction: column;
          gap: 10px;
          height: calc(100vh - 60px);
        }
        .video-tile {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
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
          display: grid;
          place-items: center;
          height: 100%;
          color: #444;
        }

        /* Landscape/Tablet View */
        @media (min-width: 768px) or (orientation: landscape) {
          .video-grid {
            flex-direction: row;
          }
        }
      `}</style>
    </div>
  );
}
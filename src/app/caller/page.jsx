"use client";

import { useEffect, useState } from "react";
import {
  StreamVideo,
  StreamCall,
  ParticipantView,
  useCallStateHooks,
} from "@stream-io/video-react-sdk";
import { createStreamClient } from "@/lib/stream";

export default function CallerPage() {
  const userId =
    "caller-" + Math.random().toString(36).slice(2, 8);

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
  }, []);

  if (!client || !call) return <p>Loading caller…</p>;

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallerInner
          call={call}
          joined={joined}
          setJoined={setJoined}
        />
      </StreamCall>
    </StreamVideo>
  );
}

function CallerInner({ call, joined, setJoined }) {
  const { useParticipants, useLocalParticipant } =
    useCallStateHooks();

  const participants = useParticipants();
  const self = useLocalParticipant();
  const host = participants.find(
    (p) => p.userId === "host"
  );

  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("");

  // Load cameras BEFORE joining
  useEffect(() => {
    async function loadDevices() {
      try {
        // 1. Try to get devices
        let devices = await navigator.mediaDevices.enumerateDevices();

        // 2. If labels are empty, it means we don't have permission yet.
        // We "ping" the camera to trigger the browser prompt.
        if (devices.every(d => !d.label)) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          // Stop the tracks immediately so the light doesn't stay on
          stream.getTracks().forEach(t => t.stop());
          // Re-enumerate now that we have permission
          devices = await navigator.mediaDevices.enumerateDevices();
        }

        const cams = devices.filter((d) => d.kind === "videoinput");
        setVideoDevices(cams);
        if (cams[0]) setSelectedDevice(cams[0].deviceId);
      } catch (err) {
        console.error("Error loading devices:", err);
      }
    }

    loadDevices();
  }, []);

  // Prime camera permission (Android fix)
  async function primeCamera(deviceId) {
    const stream =
      await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });

    stream.getTracks().forEach((t) => t.stop());
  }

  async function startCall() {
    try {
      if (selectedDevice) {
        await primeCamera(selectedDevice);
      }

      await call.join({
        create: true,
        video: true,
        audio: true,
      });

      // Explicitly select camera after join
      if (selectedDevice) {
        await call.camera.select(selectedDevice);
      }

      setJoined(true);
    } catch (e) {
      console.error("Join failed", e);
    }
  }

  if (!joined) {
    return (
      <div style={{ padding: 20 }}>
        <h2>📷 Select Camera</h2>

        <select
          style={{ width: 260, padding: 6 }}
          value={selectedDevice}
          onChange={(e) =>
            setSelectedDevice(e.target.value)
          }
        >
          {videoDevices.map((d) => (
            <option key={d.deviceId} value={d.deviceId}>
              {d.label || "Camera"}
            </option>
          ))}
        </select>

        <br />
        <br />

        <button
          onClick={startCall}
          style={{
            padding: "10px 18px",
            fontSize: 16,
          }}
        >
          📲 Call
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>📞 In Call</h2>

      <div style={{ display: "flex", gap: 20 }}>
        {/* HOST VIDEO */}
        <div>
          <p>Host</p>
          {host ? (
            <ParticipantView
              participant={host}
              style={{
                width: 320,
                height: 240,
                background: "black",
              }}
            />
          ) : (
            <p>Waiting for host…</p>
          )}
        </div>

        {/* SELF VIDEO */}
        <div>
          <p>You</p>
          {self ? (
            <ParticipantView
              participant={self}
              muted
              style={{
                width: 200,
                height: 150,
                background: "black",
              }}
            />
          ) : (
            <p>Starting camera…</p>
          )}
        </div>
      </div>
    </div>
  );
}

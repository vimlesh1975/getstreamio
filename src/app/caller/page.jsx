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

export default function CallerPage() {
  const userId =
    "caller-" + Math.random().toString(36).slice(2, 8);

  const [client, setClient] = useState(null);
  const [call, setCall] = useState(null);
  const [calling, setCalling] = useState(false);

  useEffect(() => {
    (async () => {
      const c = await createStreamClient(userId);
      const call = c.call("default", "room-1");

      setClient(c);
      setCall(call);
    })();
  }, []);

  if (!client || !call) {
    return <p>Loading caller…</p>;
  }

  return (
    <StreamVideo client={client}>
      <StreamCall call={call}>
        <CallerInner
          call={call}
          calling={calling}
          setCalling={setCalling}
        />
      </StreamCall>
    </StreamVideo>
  );
}

function CallerInner({ call, calling, setCalling }) {
  const { useParticipants } = useCallStateHooks();
  const participants = useParticipants();

  const self = participants.find((p) => p.isLocal);
  const host = participants.find(
    (p) => p.userId === "host"
  );

  async function startCall() {
    setCalling(true);

    // 🔴 Join call WITH video (publish camera)
    await call.join({
      create: true,
      video: true,
      audio: true,
    });
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>📞 Caller</h1>

      {!calling && (
        <button
          onClick={startCall}
          style={{
            padding: "10px 16px",
            fontSize: 16,
            cursor: "pointer",
          }}
        >
          📲 Call
        </button>
      )}

      {calling && (
        <div style={{ display: "flex", gap: 20, marginTop: 20 }}>
          {/* HOST VIDEO */}
          <div>
            <p>Host</p>
            {host ? (
              <ParticipantView
                participant={host}
                style={{
                  width: 400,
                  height: 300,
                  background: "black",
                }}
              />
            ) : (
              <p>Waiting for host…</p>
            )}
          </div>

          {/* SELF PREVIEW */}
          <div>
            <p>You</p>
            {self && (
              <ParticipantView
                participant={self}
                muted
                style={{
                  width: 200,
                  height: 150,
                  background: "black",
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

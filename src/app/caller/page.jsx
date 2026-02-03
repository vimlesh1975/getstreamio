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
  const {
    useParticipants,
    useLocalParticipant,
  } = useCallStateHooks();

  const participants = useParticipants();
  const self = useLocalParticipant();
  const host = participants.find(
    (p) => p.userId === "host"
  );

  async function startCall() {
    await call.join({
      create: true,
      video: true,
      audio: true,
    });

    setJoined(true);
  }

  if (!joined) {
    return (
      <div style={{ padding: 20 }}>
        <h1>📞 Caller</h1>
        <button
          onClick={startCall}
          style={{
            padding: "10px 16px",
            fontSize: 16,
          }}
        >
          📲 Call
        </button>
      </div>
    );
  }

  return (
    <div >
      {/* <label>📞 Caller</label> */}

      <div style={{ display: "flex", gap: 20 }}>
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

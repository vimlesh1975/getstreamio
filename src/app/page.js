"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function HomePage() {
  const [name, setName] = useState("");
  const router = useRouter();

  return (
    <main style={{ padding: 40 }}>
      <h1>Stream Zoom Clone (JSX)</h1>

      <input
        placeholder="Enter your name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <button
        onClick={() => router.push(`/call?user=${name || "guest"}`)}
        style={{ marginLeft: 10 }}
      >
        Join Call
      </button>
    </main>
  );
}

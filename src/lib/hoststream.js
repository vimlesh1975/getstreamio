import { StreamVideoClient } from "@stream-io/video-react-sdk";

export async function createStreamClient(userId) {
  const res = await fetch("/api/hosttoken", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({ userId }),
  });

  const { token } = await res.json();

  return new StreamVideoClient({
    apiKey: process.env.NEXT_PUBLIC_STREAM_API_KEY,
    user: { id: userId },
    token,
  });
}

import jwt from "jsonwebtoken";

export async function POST(req) {
  try {
    const { liveIndex } = await req.json();
    console.log(liveIndex)

    const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return new Response("Missing Stream credentials", {
        status: 500,
      });
    }

    // 🔐 Server JWT (no user required)
    const token = jwt.sign(
      {
        iss: "video",
        iat: Math.floor(Date.now() / 1000),
      },
      apiSecret
    );

    // 🔴 IMPORTANT: api_key MUST be in query params
    const res = await fetch(
      `https://video.stream-io-api.com/video/call/default/room-1?api_key=${apiKey}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
          "Stream-Auth-Type": "jwt",
        },
        body: JSON.stringify({
          custom: { liveIndex },
        }),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      throw new Error(text);
    }

    return Response.json({ success: true });
  } catch (err) {
    console.error("set-live-index failed:", err);
    return new Response("Failed to set live index", {
      status: 500,
    });
  }
}

import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

export async function POST(req) {
  const { callId, rtmpUrl, streamKey } = await req.json();

  const client = new StreamClient(apiKey, apiSecret);

  await client.video.startBroadcast({
    type: "default",
    id: callId,
    rtmp: {
      url: rtmpUrl,
      stream_key: streamKey,
    },
  });

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
const apiSecret = process.env.STREAM_API_SECRET;

export async function POST(req) {
  const { userId } = await req.json();

  const client = new StreamClient(apiKey, apiSecret);

  const now = Math.floor(Date.now() / 1000);

  // ✅ CORRECT: exp first, iat second
  const exp = now + 60 * 60 * 24; // 24 hours
  const iat = now - 60;           // 1 minute in the past (safe)

  const token = client.createToken(userId, exp, iat);

  return NextResponse.json(
    { token },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

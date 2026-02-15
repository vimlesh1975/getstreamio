import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const { userId } = await req.json();


  const client = new StreamClient(
    process.env.NEXT_PUBLIC_STREAM_API_KEY,
    process.env.STREAM_API_SECRET
  );

  const serverClient = new StreamClient(process.env.NEXT_PUBLIC_STREAM_API_KEY,
    process.env.STREAM_API_SECRET);

  await serverClient.upsertUsers([
    {
      id: userId,
      role: 'admin', // Sets the global role to admin
    },
  ]);


  const now = Math.floor(Date.now() / 1000);
  const token = client.createToken(
    userId,
    now + 60 * 60,
    now - 60,
  );

  return NextResponse.json({ token });
}

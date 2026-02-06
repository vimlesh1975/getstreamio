import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";

export const dynamic = "force-dynamic";

export async function POST(req) {
    const { userId, durationMinutes } = await req.json();

    if (!userId) {
        return NextResponse.json(
            { error: "userId required" },
            { status: 400 }
        );
    }

    // default = 10 minutes if not provided
    const duration =
        Number(durationMinutes) > 0
            ? Number(durationMinutes)
            : 10;

    const client = new StreamClient(
        process.env.NEXT_PUBLIC_STREAM_API_KEY,
        process.env.STREAM_API_SECRET
    );

    const now = Math.floor(Date.now() / 1000);

    const token = client.createToken(
        userId,
        now + duration * 60, // ⏱️ expiry
        now - 60             // clock skew buffer
    );

    return NextResponse.json({
        token,
        expiresInMinutes: duration,
        expiresAt: now + duration * 60,
    });
}

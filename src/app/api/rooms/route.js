import { NextResponse } from "next/server";

export async function GET() {
    try {
        // 1. Read the secret JSON
        const roomConfig = JSON.parse(process.env.ROOM_CONFIG || "{}");

        // 2. Get only the keys (names), not the passwords
        const roomNames = Object.keys(roomConfig);

        return NextResponse.json(roomNames);
    } catch (error) {
        return NextResponse.json([], { status: 500 });
    }
}
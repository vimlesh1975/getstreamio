import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { username, password } = await req.json();

        // 1. Parse the Room Config from Env
        // This creates an object like { "ddsahyadri": "5566" }
        const roomConfig = JSON.parse(process.env.ROOM_CONFIG || "{}");

        // 2. Verification Logic
        // Check if the username exists in our config AND the password matches
        const isValidRoomLogin =
            roomConfig[username] &&
            password === roomConfig[username];

        if (isValidRoomLogin) {
            const response = NextResponse.json({
                success: true,
                roomid: username // Returning the roomid for the frontend to use
            });

            // 3. Set the secure cookie
            response.cookies.set("auth", "true", {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 12, // 12 hours
            });

            return response;
        }

        // If no match found
        return NextResponse.json(
            { success: false, message: "Invalid Room ID or Password" },
            { status: 401 }
        );

    } catch (error) {
        console.error("Auth Error:", error);
        return NextResponse.json(
            { success: false, message: "Configuration Error" },
            { status: 500 }
        );
    }
}
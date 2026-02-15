import { NextResponse } from "next/server";

export async function POST(req) {
    try {
        const { username, password } = await req.json();

        // 1. Verify against the hidden server-side variable
        const isValidPassword = password === process.env.ADMIN_PASSWORD;

        // Check if the username is the admin or one of the valid rooms
        const validRooms = process.env.NEXT_PUBLIC_STREAM_ROOMS.split(",");
        const isValidUser =
            username === process.env.NEXT_PUBLIC_ADMIN_USERNAME ||
            validRooms.includes(username);

        if (isValidUser && isValidPassword) {
            const response = NextResponse.json({ success: true });

            // 2. Set the secure cookie
            response.cookies.set("auth", "true", {
                httpOnly: true, // Prevents JavaScript from reading the cookie
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 12, // 12 hours
            });

            return response;
        }

        return NextResponse.json(
            { success: false, message: "Unauthorized" },
            { status: 401 }
        );
    } catch (error) {
        return NextResponse.json({ success: false }, { status: 500 });
    }
}
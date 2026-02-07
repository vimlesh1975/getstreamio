import { NextResponse } from "next/server";

export async function POST(req) {
    const { username, password } = await req.json();

    if (username === process.env.NEXT_PUBLIC_ADMIN_USERNAME && password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
        const response = NextResponse.json({ success: true });

        response.cookies.set("auth", "true", {
            httpOnly: true,
            path: "/",
        });

        return response;
    }

    return NextResponse.json(
        { success: false },
        { status: 401 }
    );
}

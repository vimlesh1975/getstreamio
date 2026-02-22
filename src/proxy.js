// src/proxy.js
import { NextResponse } from "next/server";

export function proxy(request) {
    const authCookie = request.cookies.get("auth");
    const authenticatedStation = authCookie?.value; // This is now 'ddsahyadri', etc.
    const { pathname } = request.nextUrl;

    if (pathname.startsWith("/dashboard/")) {
        // 1. Get the room ID from the URL
        const requestedRoom = pathname.split("/")[2];

        // 2. If no cookie at all, redirect to login
        if (!authenticatedStation) {
            return NextResponse.redirect(new URL("/", request.url));
        }

        // 3. STATION LOCK: If the cookie station doesn't match the URL station, block it!
        // This prevents ddsahyadri from entering dditanagar
        if (authenticatedStation !== requestedRoom) {
            console.error(`Station Mismatch: ${authenticatedStation} tried to access ${requestedRoom}`);
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};
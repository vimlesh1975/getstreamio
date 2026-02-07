import { NextResponse } from "next/server";

export function middleware(request) {
    const auth = request.cookies.get("auth");

    if (!auth) {
        return NextResponse.redirect(new URL("/", request.url));
    }
}

export const config = {
    matcher: ["/dashboard/:path*"],
};

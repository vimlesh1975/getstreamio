import { NextResponse } from "next/server";

export function proxy(request) {
    const auth = request.cookies.get("auth");

    if (!auth) {
        return NextResponse.redirect(
            new URL("/", request.url)
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*"],
};

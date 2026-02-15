import jwt from "jsonwebtoken";

export async function POST(req) {
    try {
        // 👈 Extract roomid from request
        const { programKey, liveUserId, roomid } = await req.json();

        if (!roomid) throw new Error("Missing roomid");

        const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY;
        const apiSecret = process.env.STREAM_API_SECRET;

        const token = jwt.sign(
            { iss: "video", iat: Math.floor(Date.now() / 1000) },
            apiSecret
        );

        // 1️⃣ READ existing call data using the dynamic roomid
        const getRes = await fetch(
            `https://video.stream-io-api.com/video/call/default/${roomid}?api_key=${apiKey}`,
            {
                headers: {
                    Authorization: token,
                    "Stream-Auth-Type": "jwt",
                },
            }
        );

        if (!getRes.ok) throw new Error(`Failed to fetch call: ${roomid}`);

        const callData = await getRes.json();
        const existingPrograms = callData.call?.custom?.programs || {};

        // 2️⃣ MERGE programs
        const updatedPrograms = {
            ...existingPrograms,
            [programKey]: liveUserId,
        };

        // 3️⃣ UPDATE call (Using the dynamic roomid)
        const patchRes = await fetch(
            `https://video.stream-io-api.com/video/call/default/${roomid}?api_key=${apiKey}`,
            {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                    "Stream-Auth-Type": "jwt",
                },
                body: JSON.stringify({
                    custom: {
                        programs: updatedPrograms,
                    },
                }),
            }
        );

        if (!patchRes.ok)
            throw new Error(await patchRes.text());

        return Response.json({ success: true });
    } catch (err) {
        console.error("set-live-user failed:", err);
        return new Response("Failed", { status: 500 });
    }
}
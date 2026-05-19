"use client";

import { useEffect, useState } from "react";
// 1. Ensure the CSS is imported (you already have this)
import "@stream-io/video-react-sdk/dist/css/styles.css";

import {
    StreamVideo,
    StreamCall,
    SpeakerLayout,
    CallControls,
    StreamTheme, // 2. Import StreamTheme

} from "@stream-io/video-react-sdk";

import { createStreamClient } from "@/lib/stream";

export default function MeetingPage() {
    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [userId] = useState(() => "caller-" + Math.random().toString(36).slice(2, 8));

    useEffect(() => {
        let joinedCall;

        async function init() {
            const c = await createStreamClient(userId);
            const newCall = c.call("default", "room-1");

            await newCall.join({
                create: true,
                video: false,
                audio: false,
            });

            joinedCall = newCall;
            setClient(c);
            setCall(newCall);
        }
        init();

        // Cleanup: Leave the call when the component unmounts
        return () => {
            if (joinedCall) joinedCall.leave();
        };
    }, [userId]);

    if (!client || !call) return <div className="h-screen flex items-center justify-center">Loading...</div>;

    return (
        <StreamVideo client={client}>
            {/* 3. Wrap everything in a div with a specific height */}
            <div className="h-screen w-full">
                <StreamCall call={call}>
                    <StreamTheme>
                        <SpeakerLayout />
                        <CallControls />
                    </StreamTheme>
                </StreamCall>
            </div>
        </StreamVideo>
    );
}

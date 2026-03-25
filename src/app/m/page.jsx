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
    SfuModels,
    useCallStateHooks,

} from "@stream-io/video-react-sdk";

import { createStreamClient } from "@/lib/stream";

export default function MeetingPage() {
    const [client, setClient] = useState(null);
    const [call, setCall] = useState(null);
    const [userId] = useState(() => "caller-" + Math.random().toString(36).slice(2, 8));
    const { useParticipants } = useCallStateHooks();

    const participants = useParticipants();
    const screenShareParticipant = participants.find((p) =>
        p.publishedTracks.includes(SfuModels.TrackType.SCREEN_SHARE)
    );

    useEffect(() => {
        async function init() {
            const c = await createStreamClient(userId);
            const newCall = c.call("default", "room-1");

            await newCall.join({
                create: true,
                video: true,
                audio: true,
            });

            setClient(c);
            setCall(newCall);
        }
        init();

        // Cleanup: Leave the call when the component unmounts
        return () => {
            if (call) call.leave();
        };
    }, []);

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
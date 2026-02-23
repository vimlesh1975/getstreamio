"use client";

import React, { useState, useEffect, useRef } from 'react';

const DecklinkSelector = () => {
    const [devices, setDevices] = useState([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState('');
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState('');

    const videoRef = useRef(null);
    const streamRef = useRef(null);

    // 1. Load Devices on Mount
    useEffect(() => {
        async function getDevices() {
            try {
                // Request permission to see device labels
                const initStream = await navigator.mediaDevices.getUserMedia({ video: true });
                initStream.getTracks().forEach(track => track.stop());

                const allDevices = await navigator.mediaDevices.enumerateDevices();
                const videoInputs = allDevices.filter(d => d.kind === 'videoinput');

                setDevices(videoInputs);
                if (videoInputs.length > 0) {
                    setSelectedDeviceId(videoInputs[0].deviceId);
                }
            } catch (err) {
                setError("Camera access denied. Please allow permissions in the browser.");
            }
        }
        getDevices();

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    // 2. Start Stream Logic
    const startStream = async () => {
        if (!selectedDeviceId) return;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
        }

        const constraints = {
            audio: true,
            video: {
                deviceId: { exact: selectedDeviceId },
                width: 1920,
                height: 1080,
                frameRate: 25
            }
        };

        try {
            setError('');
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsStreaming(true);
            }
        } catch (err) {
            setError(`Stream Error: ${err.name}. Device may be busy or unsupported.`);
            setIsStreaming(false);
        }
    };

    // --- Plain Inline Styles ---
    const styles = {
        container: { fontFamily: 'sans-serif', padding: '20px', maxWidth: '300px', margin: '0 auto' },
        panel: { background: '#f4f4f4', padding: '20px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '20px' },
        select: { width: '30%', padding: '10px', marginBottom: '10px', borderRadius: '4px', border: '1px solid #ccc' },
        button: { width: '30%', padding: '12px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
        idLabel: { fontSize: '11px', color: '#666', wordBreak: 'break-all', display: 'block', marginBottom: '15px' },
        video: { width: '30%', background: '#000', borderRadius: '8px', display: isStreaming ? 'block' : 'none' },
        placeholder: { width: '30%', height: '400px', background: '#333', borderRadius: '8px', display: isStreaming ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' },
        error: { color: 'red', marginBottom: '10px', fontWeight: 'bold' }
    };

    return (
        <div style={styles.container}>
            <div style={styles.panel}>
                <h3>Video Input Selection</h3>

                {error && <div style={styles.error}>{error}</div>}

                <label style={{ fontSize: '14px' }}>Choose Device:</label>
                <select
                    style={styles.select}
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                >
                    {devices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${device.deviceId.substring(0, 5)}`}
                        </option>
                    ))}
                </select>

                <span style={styles.idLabel}>Target ID: {selectedDeviceId}</span>

                <button style={styles.button} onClick={startStream}>
                    Initialize Stream
                </button>
            </div>

            <div style={{ textAlign: 'center' }}>
                <video ref={videoRef} autoPlay playsInline style={styles.video} />
                {!isStreaming && <div style={styles.placeholder}>Video Preview Offline</div>}
            </div>
        </div>
    );
};

export default DecklinkSelector;
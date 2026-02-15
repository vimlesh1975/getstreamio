"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();

  // --- Room Logic ---
  // We use the Public environment variable to populate the dropdown.
  // The password remains a secret on the server side.
  const roomsString = process.env.NEXT_PUBLIC_STREAM_ROOMS || "Default_Room";
  const rooms = roomsString.split(",");

  // Initialize with the first room in your list
  const [username, setUsername] = useState(rooms[0] || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent page refresh
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        // ✅ Success: Redirect to the specific dashboard for that room
        router.push(`/dashboard/${username}`);
      } else {
        // ❌ Fail: API returned 401 Unauthorized
        setError("Invalid password for the selected room.");
      }
    } catch (e) {
      setError("Connection failed. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="title">🎙️ Studio Login</h1>
        <p className="subtitle">Select a studio and enter the master password</p>

        <form onSubmit={handleLogin}>
          {/* ---------- ROOM SELECTION ---------- */}
          <div className="field">
            <label>Control Room</label>
            <select
              className="room-select"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            >
              {rooms.map((room) => (
                <option key={room} value={room}>
                  {room.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* ---------- PASSWORD INPUT ---------- */}
          <div className="field">
            <label>Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          {error && <div className="error">{error}</div>}

          <button
            type="submit"
            className="login-btn"
            disabled={loading || !username || !password}
          >
            {loading ? "Authenticating..." : `Enter ${username.replace(/_/g, " ")}`}
          </button>
        </form>
      </div>

      <style jsx>{`
        .login-page {
          height: 100vh;
          display: grid;
          place-items: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          font-family: 'Inter', sans-serif;
        }
        .login-card {
          width: 380px;
          background: #ffffff;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .title { margin: 0 0 10px; text-align: center; font-size: 1.75rem; color: #1e293b; font-weight: 800; }
        .subtitle { margin: 0 0 30px; text-align: center; font-size: 0.95rem; color: #64748b; }
        .field { margin-bottom: 20px; }
        .field label { display: block; font-size: 0.85rem; margin-bottom: 8px; color: #475569; font-weight: 600; }
        
        .room-select, .field input {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          border: 2px solid #e2e8f0;
          font-size: 1rem;
          outline: none;
          background: #f8fafc;
          transition: all 0.2s;
        }

        .room-select:focus, .field input:focus {
          border-color: #3b82f6;
          background: #ffffff;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .room-select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 15px center;
          background-size: 18px;
        }

        .error {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px;
          border-radius: 10px;
          font-size: 0.85rem;
          margin-bottom: 20px;
          text-align: center;
          border: 1px solid #fee2e2;
        }

        .login-btn {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: none;
          background: #2563eb;
          color: white;
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
        }

        .login-btn:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.4);
        }

        .login-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
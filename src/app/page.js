"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

export default function Login() {
  const router = useRouter();
  const [rooms, setRooms] = useState([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRooms() {
      try {
        const res = await fetch("/api/rooms");
        const data = await res.json();
        setRooms(data);
        if (data.length > 0) setUsername(data[0]);
      } catch (e) {
        setError("Network Error: Could not reach control server.");
      } finally {
        setLoading(false);
      }
    }
    fetchRooms();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push(`/dashboard/${username}`);
      } else {
        setError("Access Denied: Invalid Authentication");
      }
    } catch (e) {
      setError("System Offline: Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="background-glow"></div>

      <div className="glass-card">
        <header className="card-header">
          <h1>GetStream</h1>
        </header>

        {loading && rooms.length === 0 ? (
          <div className="loader">Initializing Secure Link...</div>
        ) : (
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>User</label>
              <select
                className="styled-select"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              >
                {rooms.map((room) => (
                  <option key={room} value={room}>
                    🛰️ {room.replace(/_/g, " ").toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label>Pasword</label>
              <input
                className="styled-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && <div className="error-banner">{error}</div>}

            <button type="submit" className="glow-button" disabled={loading}>
              {loading ? (
                <span className="pulse">VERIFYING...</span>
              ) : (
                `Submit`
              )}
            </button>
          </form>
        )}

      </div>

      <style jsx>{`
        .login-container {
          height: 100dvh;
          width: 100vw;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #020617;
          overflow: hidden;
          position: relative;
          font-family: 'Inter', -apple-system, sans-serif;
        }

        .background-glow {
          position: absolute;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%);
          filter: blur(60px);
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .glass-card {
          width: 420px;
          background: rgba(15, 23, 42, 0.8);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          z-index: 10;
        }

        .live-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 900;
          color: #94a3b8;
          border: 1px solid #334155;
          padding: 2px 8px;
          border-radius: 4px;
          margin-bottom: 12px;
          letter-spacing: 1px;
        }

        h1 {
          color: #f8fafc;
          font-size: 1.5rem;
          font-weight: 800;
          margin: 0;
          letter-spacing: -0.5px;
        }

        p {
          color: #64748b;
          font-size: 0.85rem;
          margin: 8px 0 32px;
        }

        .input-group {
          margin-bottom: 24px;
        }

        label {
          display: block;
          color: #3b82f6;
          font-size: 11px;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: 1px;
        }

        .styled-select, .styled-input {
          width: 100%;
          background: rgba(2, 6, 23, 0.6);
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 14px;
          color: white;
          font-size: 1rem;
          outline: none;
          transition: all 0.2s;
        }

        .styled-select:focus, .styled-input:focus {
          border-color: #3b82f6;
          background: rgba(2, 6, 23, 0.9);
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
        }

        .styled-select {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
          background-repeat: no-repeat;
          background-position: right 15px center;
          background-size: 16px;
        }

        .error-banner {
          background: rgba(239, 68, 68, 0.1);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 12px;
          border-radius: 8px;
          font-size: 0.8rem;
          margin-bottom: 24px;
          text-align: center;
        }

        .glow-button {
          width: 100%;
          padding: 16px;
          border-radius: 12px;
          border: none;
          background: #2563eb;
          color: white;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .glow-button:hover:not(:disabled) {
          background: #3b82f6;
          box-shadow: 0 0 20px rgba(37, 99, 235, 0.4);
          transform: translateY(-1px);
        }

        .glow-button:disabled {
          background: #1e293b;
          color: #475569;
          cursor: not-allowed;
        }

        .card-footer {
          margin-top: 32px;
          text-align: center;
          color: #334155;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 1px;
        }

        .pulse {
          animation: pulse-anim 1.5s infinite;
        }

        @keyframes pulse-anim {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }

        .loader {
          color: #64748b;
          text-align: center;
          font-size: 0.9rem;
          padding: 40px 0;
        }
      `}</style>
    </div>
  );
}
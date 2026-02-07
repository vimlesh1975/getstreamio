"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Login() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (res.ok) {
        router.push("/dashboard");
      } else {
        setError("Invalid username or password");
      }
    } catch (e) {
      setError("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="title">🎙️ Studio Login</h1>
        <p className="subtitle">
          Sign in to access the control room
        </p>

        <div className="field">
          <label>Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
          />
        </div>

        <div className="field">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>

        {error && <div className="error">{error}</div>}

        <button
          className="login-btn"
          onClick={login}
          disabled={loading || !username || !password}
        >
          {loading ? "Signing in…" : "Login"}
        </button>
      </div>

      {/* ---------- STYLES ---------- */}
      <style jsx>{`
        .login-page {
          height: 100vh;
          display: grid;
          place-items: center;
          background: linear-gradient(
            135deg,
            #f8fafc 0%,
            #e2e8f0 100%
          );
          font-family: Inter, system-ui, sans-serif;
        }

        .login-card {
          width: 360px;
          background: white;
          padding: 32px;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
        }

        .title {
          margin: 0 0 8px;
          text-align: center;
          font-size: 1.5rem;
          color: #0f172a;
        }

        .subtitle {
          margin: 0 0 24px;
          text-align: center;
          font-size: 0.9rem;
          color: #64748b;
        }

        .field {
          margin-bottom: 16px;
        }

        .field label {
          display: block;
          font-size: 0.8rem;
          margin-bottom: 6px;
          color: #475569;
        }

        .field input {
          width: 100%;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #cbd5f5;
          font-size: 0.95rem;
          outline: none;
          transition: border 0.2s, box-shadow 0.2s;
        }

        .field input:focus {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15);
        }

        .error {
          background: #fee2e2;
          color: #991b1b;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.8rem;
          margin-bottom: 14px;
          text-align: center;
        }

        .login-btn {
          width: 100%;
          padding: 14px;
          border-radius: 10px;
          border: none;
          background: #2563eb;
          color: white;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          transition: transform 0.15s, background 0.15s;
        }

        .login-btn:hover:not(:disabled) {
          background: #1d4ed8;
          transform: translateY(-1px);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

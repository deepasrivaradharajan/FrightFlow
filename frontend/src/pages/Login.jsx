import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../api/endpoints";

export default function Login() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "admin" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        await registerUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
        setMode("login");
        setError("Account created — please log in.");
      } else {
        const res = await loginUser({ email: form.email, password: form.password });
        localStorage.setItem("token", res.data.access_token);
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "var(--bg)",
    }}>
      <form onSubmit={handleSubmit} className="card" style={{ width: 360 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--accent)", display: "flex",
            alignItems: "center", justifyContent: "center", fontWeight: 700,
          }}>⚡</div>
          <strong style={{ fontSize: 20 }}>FleetFlow</strong>
        </div>

        <h2 style={{ margin: "0 0 20px", fontSize: 18 }}>
          {mode === "login" ? "Sign in to your workspace" : "Create an admin account"}
        </h2>

        {error && (
          <p style={{ color: error.includes("created") ? "var(--accent)" : "var(--danger)", fontSize: 13, marginBottom: 12 }}>
            {error}
          </p>
        )}

        {mode === "register" && (
          <div className="form-field">
            <label>Full Name</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
        )}

        <div className="form-field">
          <label>Email</label>
          <input required type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
        </div>

        <div className="form-field">
          <label>Password</label>
          <input required type="password" value={form.password} onChange={(e) => update("password", e.target.value)} />
        </div>

        <button className="btn" type="submit" disabled={loading} style={{ width: "100%", marginTop: 8 }}>
          {loading ? "Please wait…" : mode === "login" ? "Sign In" : "Create Account"}
        </button>

        <p style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 16, textAlign: "center" }}>
          {mode === "login" ? (
            <>Don't have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode("register"); setError(""); }} style={{ color: "var(--accent)" }}>Register</a></>
          ) : (
            <>Already have an account? <a href="#" onClick={(e) => { e.preventDefault(); setMode("login"); setError(""); }} style={{ color: "var(--accent)" }}>Sign in</a></>
          )}
        </p>
      </form>
    </div>
  );
}
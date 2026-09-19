import React, { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../api/endpoints";

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", role: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getProfile()
      .then((res) => {
        setProfile(res.data);
        setForm({ name: res.data.name, email: res.data.email, role: res.data.role });
      })
      .catch((err) => setError(err.response?.data?.detail || err.message));
  }, []);

  async function handleSave(e) {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      const res = await updateProfile(form);
      setProfile(res.data);
      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    }
  }

  function handleLogout() {
    localStorage.removeItem("token");
    window.location.href = "/login";
  }

  return (
    <div>
      <h1 className="page-title">Account & Settings</h1>
      <p className="page-subtitle">Manage your profile information.</p>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {message && <p style={{ color: "var(--accent)" }}>{message}</p>}

      {!profile ? (
        <p>Loading profile…</p>
      ) : (
        <div className="card" style={{ maxWidth: 420 }}>
          <h3 className="card-title">Profile</h3>
          <form onSubmit={handleSave}>
            <div className="form-field">
              <label>Full Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-field">
              <label>Role</label>
              <input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
            </div>
            <button className="btn" type="submit">Save Changes</button>
          </form>
        </div>
      )}

      <div className="card" style={{ maxWidth: 420, marginTop: 20 }}>
        <h3 className="card-title">Session</h3>
        <button className="btn secondary" onClick={handleLogout}>Log Out</button>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { getFuelRecords, getFuelAnalytics, createFuelRecord, getVehicles } from "../api/endpoints";

export default function Fuel() {
  const [records, setRecords] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    vehicle_id: "", fuel_date: "", liters: "", cost: "", odometer_reading: "", fuel_station: "",
  });

  useEffect(() => {
    loadAll();
  }, []);

  function loadAll() {
    Promise.all([getFuelRecords(), getFuelAnalytics(), getVehicles()])
      .then(([recRes, anaRes, vehRes]) => {
        setRecords(recRes.data);
        setAnalytics(anaRes.data);
        setVehicles(vehRes.data);
      })
      .catch((err) => setError(err.response?.data?.detail || err.message));
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    try {
      await createFuelRecord({
        vehicle_id: Number(form.vehicle_id),
        fuel_date: new Date(form.fuel_date).toISOString(),
        liters: Number(form.liters),
        cost: Number(form.cost),
        odometer_reading: form.odometer_reading ? Number(form.odometer_reading) : null,
        fuel_station: form.fuel_station || null,
      });
      setMessage("Fuel record added successfully.");
      setForm({ vehicle_id: "", fuel_date: "", liters: "", cost: "", odometer_reading: "", fuel_station: "" });
      setShowForm(false);
      loadAll();
    } catch (err) {
      setError(err.response?.data?.detail || err.message);
    }
  }

  const chartData = records
    .slice()
    .sort((a, b) => new Date(a.fuel_date) - new Date(b.fuel_date))
    .map((r) => ({ name: r.fuel_date?.slice(0, 10), liters: r.liters, cost: r.cost }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 className="page-title">Fuel Monitoring & Analytics</h1>
          <p className="page-subtitle">Comprehensive view of fuel records and fleet efficiency.</p>
        </div>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? "Cancel" : "+ Add Fuel Record"}
        </button>
      </div>

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      {message && <p style={{ color: "var(--accent)" }}>{message}</p>}

      {showForm && (
        <form onSubmit={handleAdd} className="card" style={{ marginBottom: 20, maxWidth: 480 }}>
          <h3 className="card-title">New Fuel Record</h3>
          <div className="form-field">
            <label>Vehicle</label>
            <select required value={form.vehicle_id} onChange={(e) => setForm({ ...form, vehicle_id: e.target.value })}>
              <option value="">Select vehicle</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>VH-{v.id} — {v.vehicle_number}</option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Date</label>
            <input required type="datetime-local" value={form.fuel_date} onChange={(e) => setForm({ ...form, fuel_date: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Liters</label>
            <input required type="number" step="0.1" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Cost (₹)</label>
            <input required type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Odometer Reading (optional)</label>
            <input type="number" value={form.odometer_reading} onChange={(e) => setForm({ ...form, odometer_reading: e.target.value })} />
          </div>
          <div className="form-field">
            <label>Fuel Station (optional)</label>
            <input value={form.fuel_station} onChange={(e) => setForm({ ...form, fuel_station: e.target.value })} />
          </div>
          <button className="btn" type="submit">Save Record</button>
        </form>
      )}

      {analytics && (
        <div className="stat-grid">
          <div className="stat-card"><span className="stat-label">Total Consumed</span><p className="stat-value">{analytics.total_liters} L</p></div>
          <div className="stat-card"><span className="stat-label">Total Cost</span><p className="stat-value">₹{analytics.total_cost}</p></div>
          <div className="stat-card"><span className="stat-label">Avg Cost/Liter</span><p className="stat-value">₹{analytics.average_cost_per_liter}</p></div>
          <div className="stat-card"><span className="stat-label">Records Logged</span><p className="stat-value">{analytics.total_records}</p></div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 className="card-title">Fuel Cost Per Record</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} />
              <YAxis stroke="var(--text-muted)" fontSize={12} />
              <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
              <Bar dataKey="cost" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h3 className="card-title">Fuel Records</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th><th>Date</th><th>Vehicle</th><th>Station</th><th>Liters</th><th>Cost</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.id}>
                <td>FR-{r.id}</td>
                <td>{r.fuel_date?.slice(0, 10)}</td>
                <td>VH-{r.vehicle_id}</td>
                <td>{r.fuel_station || "—"}</td>
                <td>{r.liters}</td>
                <td>₹{r.cost}</td>
              </tr>
            ))}
            {records.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--text-muted)" }}>No fuel records yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
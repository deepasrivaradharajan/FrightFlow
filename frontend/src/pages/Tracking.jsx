import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getTrips } from "../api/endpoints";
import { API_URL } from "../api/client";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function Tracking() {
  const [trips, setTrips] = useState([]);
  const [trackedIds, setTrackedIds] = useState([]);
  const [positions, setPositions] = useState({});
  const [statuses, setStatuses] = useState({});
  const [connections, setConnections] = useState({});
  const socketsRef = useRef({});

  useEffect(() => {
    getTrips().then((res) => setTrips(res.data)).catch(() => {});
  }, []);

  function toggleTrack(tripId) {
    setTrackedIds((prev) =>
      prev.includes(tripId) ? prev.filter((id) => id !== tripId) : [...prev, tripId]
    );
  }

  useEffect(() => {
    // close sockets for trips no longer tracked
    Object.keys(socketsRef.current).forEach((id) => {
      if (!trackedIds.includes(Number(id))) {
        socketsRef.current[id].close();
        delete socketsRef.current[id];
        setPositions((p) => { const c = { ...p }; delete c[id]; return c; });
        setConnections((c) => { const n = { ...c }; delete n[id]; return n; });
      }
    });

    // open sockets for newly tracked trips
    trackedIds.forEach((tripId) => {
      if (socketsRef.current[tripId]) return;

      const wsUrl = API_URL.replace(/^http/, "ws") + `/ws/tracking/${tripId}`;
      const socket = new WebSocket(wsUrl);
      socketsRef.current[tripId] = socket;

      socket.onopen = () => setConnections((c) => ({ ...c, [tripId]: true }));
      socket.onclose = () => setConnections((c) => ({ ...c, [tripId]: false }));

      socket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === "vehicle_location") {
          setPositions((p) => ({ ...p, [tripId]: [data.latitude, data.longitude] }));
        } else if (data.type === "shipment_status") {
          setStatuses((s) => ({ ...s, [tripId]: `Shipment #${data.shipment_id}: ${data.status}` }));
        }
      };
    });

    return () => {};
  }, [trackedIds]);

  useEffect(() => {
    return () => {
      Object.values(socketsRef.current).forEach((s) => s.close());
    };
  }, []);

  const trackedTrips = trips.filter((t) => trackedIds.includes(t.id));
  const anyPosition = Object.values(positions)[0];
  const onlineCount = Object.values(connections).filter(Boolean).length;

  return (
    <div>
      <h1 className="page-title">Live GPS Tracking</h1>
      <p className="page-subtitle">Real-time vehicle positions streamed over WebSocket — track multiple vehicles at once.</p>

      <div className="stat-grid">
        <div className="stat-card"><span className="stat-label">Available Trips</span><p className="stat-value">{trips.length}</p></div>
        <div className="stat-card"><span className="stat-label">Currently Tracking</span><p className="stat-value">{trackedIds.length}</p></div>
        <div className="stat-card"><span className="stat-label">Units Online</span><p className="stat-value">{onlineCount}</p></div>
      </div>

      <div className="grid-2" style={{ gridTemplateColumns: "300px 1fr" }}>
        <div className="card">
          <h3 className="card-title">Select Trips to Track</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 420, overflowY: "auto" }}>
            {trips.map((t) => (
              <label
                key={t.id}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px", borderRadius: 8,
                  background: trackedIds.includes(t.id) ? "var(--accent-soft)" : "var(--bg)",
                  border: "1px solid var(--border)", cursor: "pointer", fontSize: 13,
                }}
              >
                <input
                  type="checkbox"
                  checked={trackedIds.includes(t.id)}
                  onChange={() => toggleTrack(t.id)}
                />
                <div>
                  <div style={{ fontWeight: 600 }}>TR-{t.id}</div>
                  <div style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                    {t.pickup_location} → {t.destination}
                  </div>
                  {connections[t.id] !== undefined && (
                    <div style={{ color: connections[t.id] ? "var(--accent)" : "var(--danger)", fontSize: 11 }}>
                      {connections[t.id] ? "● live" : "○ connecting…"}
                    </div>
                  )}
                </div>
              </label>
            ))}
            {trips.length === 0 && (
              <p style={{ color: "var(--text-muted)", fontSize: 13 }}>No trips available yet.</p>
            )}
          </div>

          {Object.keys(statuses).length > 0 && (
            <div style={{ marginTop: 16, borderTop: "1px solid var(--border)", paddingTop: 12 }}>
              <h4 style={{ fontSize: 13, margin: "0 0 8px" }}>Recent Status Updates</h4>
              {Object.entries(statuses).map(([tripId, msg]) => (
                <p key={tripId} style={{ fontSize: 12, color: "var(--info)", margin: "4px 0" }}>{msg}</p>
              ))}
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <MapContainer
            center={anyPosition || [13.0827, 80.2707]}
            zoom={11}
            style={{ height: 500, width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            {trackedTrips.map((t) =>
              positions[t.id] ? (
                <Marker key={t.id} position={positions[t.id]}>
                  <Popup>
                    Trip TR-{t.id}<br />
                    {t.pickup_location} → {t.destination}<br />
                    Status: {t.status}
                  </Popup>
                </Marker>
              ) : null
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
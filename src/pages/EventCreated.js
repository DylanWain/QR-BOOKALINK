import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getEvent } from "../services/eventService";

const EventCreated = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [copied, setCopied] = useState({ ticket: false, dashboard: false });

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    const { data, error } = await getEvent(eventId);
    if (!error && data) {
      setEventData(data);
    }
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [type]: true });
    setTimeout(() => setCopied({ ...copied, [type]: false }), 2000);
  };

  if (!eventData) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <div style={{ fontSize: "18px", fontWeight: 600 }}>Loading...</div>
      </div>
    );
  }

  const ticketLink = `${window.location.origin}/stripe-pay/${eventId}`;
  const dashboardLink = `${window.location.origin}/dash/${eventId}`;

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "20px",
          borderBottom: "3px solid #000000",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "clamp(24px, 6vw, 32px)",
              fontWeight: 900,
              color: "#FFFFFF",
              textShadow: "3px 3px 0px rgba(0,0,0,0.3)",
              margin: 0,
            }}
          >
            ✅ Event Created!
          </h1>
        </div>
      </div>

      <div
        style={{ maxWidth: "700px", margin: "0 auto", padding: "40px 20px" }}
      >
        {/* Success Card */}
        <div
          style={{
            background: "#FFFFFF",
            border: "4px solid #000000",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "8px 8px 0px #000000",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "80px", marginBottom: "16px" }}>🎉</div>
          <h2
            style={{ fontSize: "32px", fontWeight: 900, marginBottom: "12px" }}
          >
            {eventData.event_name} is Live!
          </h2>
          <p
            style={{ fontSize: "16px", color: "#666666", marginBottom: "32px" }}
          >
            Share your ticket link and start selling
          </p>

          {/* Ticket Link */}
          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "8px",
                textAlign: "left",
              }}
            >
              📱 Ticket Link (Share This):
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={ticketLink}
                readOnly
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "3px solid #000000",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  background: "#F9FAFB",
                }}
              />
              <button
                onClick={() => copyToClipboard(ticketLink, "ticket")}
                style={{
                  background: copied.ticket ? "#10B981" : "#667eea",
                  color: "#FFFFFF",
                  border: "3px solid #000000",
                  borderRadius: "10px",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "3px 3px 0px #000000",
                  whiteSpace: "nowrap",
                }}
              >
                {copied.ticket ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
          </div>

          {/* Dashboard Link */}
          <div style={{ marginBottom: "32px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: 700,
                marginBottom: "8px",
                textAlign: "left",
              }}
            >
              📊 Dashboard Link (For You):
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                value={dashboardLink}
                readOnly
                style={{
                  flex: 1,
                  padding: "12px",
                  border: "3px solid #000000",
                  borderRadius: "10px",
                  fontSize: "14px",
                  fontWeight: 600,
                  fontFamily: "monospace",
                  background: "#F9FAFB",
                }}
              />
              <button
                onClick={() => copyToClipboard(dashboardLink, "dashboard")}
                style={{
                  background: copied.dashboard ? "#10B981" : "#667eea",
                  color: "#FFFFFF",
                  border: "3px solid #000000",
                  borderRadius: "10px",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 800,
                  cursor: "pointer",
                  boxShadow: "3px 3px 0px #000000",
                  whiteSpace: "nowrap",
                }}
              >
                {copied.dashboard ? "✓ Copied!" : "📋 Copy"}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
            }}
          >
            <button
              onClick={() => window.open(ticketLink, "_blank")}
              style={{
                background: "#FFFFFF",
                color: "#000000",
                border: "3px solid #000000",
                borderRadius: "12px",
                padding: "16px",
                fontSize: "16px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "4px 4px 0px #000000",
              }}
            >
              👁️ Preview
            </button>
            <button
              onClick={() => navigate(`/dash/${eventId}`)}
              style={{
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#FFFFFF",
                border: "3px solid #000000",
                borderRadius: "12px",
                padding: "16px",
                fontSize: "16px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "4px 4px 0px #000000",
              }}
            >
              📊 Dashboard
            </button>
          </div>
        </div>

        {/* Back to Events Button */}
        <button
          onClick={() => navigate("/my-events")}
          style={{
            width: "100%",
            background: "#FFFFFF",
            color: "#000000",
            border: "3px solid #000000",
            borderRadius: "16px",
            padding: "16px",
            fontSize: "16px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "4px 4px 0px #000000",
          }}
        >
          ← Back to My Events
        </button>
      </div>
    </div>
  );
};

export default EventCreated;

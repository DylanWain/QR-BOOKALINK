import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Html5QrcodeScanner } from "html5-qrcode";
import { supabase } from "../config/supabase";
import { useAuth } from "../context/AuthContext";

const QRScanner = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [scanner, setScanner] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [eventData, setEventData] = useState(null);

  useEffect(() => {
    if (user && eventId) {
      loadEventData();
      initScanner();
    }

    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [user, eventId]);

  const loadEventData = async () => {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Error loading event:", error);
      navigate("/my-events");
    } else {
      setEventData(data);
    }
  };

  const initScanner = () => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      false
    );

    html5QrcodeScanner.render(onScanSuccess, onScanError);
    setScanner(html5QrcodeScanner);
    setScanning(true);
  };

  const onScanSuccess = async (decodedText) => {
    if (scanning) {
      setScanning(false);

      // Pause scanner
      if (scanner) {
        scanner.pause();
      }

      // Verify ticket
      await verifyTicket(decodedText);
    }
  };

  const onScanError = (error) => {
    // Ignore scan errors (happens constantly while scanning)
  };

  const verifyTicket = async (ticketCode) => {
    try {
      // Get ticket from database
      const { data: ticketData, error: ticketError } = await supabase
        .from("tickets")
        .select("*")
        .eq("ticket_code", ticketCode)
        .single();

      if (ticketError || !ticketData) {
        // SCENARIO 4: Invalid ticket
        setResult({
          status: "invalid",
          message: "INVALID TICKET",
          detail: "Ticket not found",
          icon: "❌",
          color: "#EF4444",
          ticketCode: ticketCode,
        });
        return;
      }

      // Check if ticket is for this event
      if (ticketData.event_id !== eventId) {
        setResult({
          status: "invalid",
          message: "WRONG EVENT",
          detail: "This ticket is for a different event",
          icon: "❌",
          color: "#EF4444",
          ticket: ticketData,
        });
        return;
      }

      // SCENARIO 3: Payment not confirmed
      if (ticketData.payment_status !== "completed") {
        setResult({
          status: "not_paid",
          message: "PAYMENT NOT CONFIRMED",
          detail: "⚠️ DO NOT ADMIT - Payment pending",
          icon: "❌",
          color: "#EF4444",
          ticket: ticketData,
        });
        return;
      }

      // SCENARIO 2: Already checked in
      if (ticketData.checked_in) {
        setResult({
          status: "already_checked_in",
          message: "ALREADY CHECKED IN",
          detail: "This ticket was already used",
          icon: "⚠️",
          color: "#F59E0B",
          ticket: ticketData,
          checkedInTime: ticketData.checked_in_at,
        });
        return;
      }

      // SCENARIO 1: Valid ticket - ready to check in
      setResult({
        status: "valid",
        message: "VERIFIED - ADMIT",
        detail: "Payment confirmed",
        icon: "✅",
        color: "#10B981",
        ticket: ticketData,
      });
    } catch (error) {
      console.error("Verification error:", error);
      setResult({
        status: "error",
        message: "ERROR",
        detail: "Failed to verify ticket",
        icon: "❌",
        color: "#EF4444",
      });
    }
  };

  const handleCheckIn = async () => {
    if (!result || !result.ticket) return;

    try {
      // Update ticket as checked in
      const { error } = await supabase
        .from("tickets")
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString(),
        })
        .eq("id", result.ticket.id);

      if (error) {
        alert("Failed to check in. Please try again.");
        return;
      }

      // Show success message
      setResult({
        status: "checked_in_success",
        message: "✅ CHECKED IN!",
        detail: `${result.ticket.buyer_name} admitted successfully`,
        icon: "✅",
        color: "#10B981",
      });

      // Auto-resume scanning after 2 seconds
      setTimeout(() => {
        resumeScanning();
      }, 2000);
    } catch (error) {
      console.error("Check-in error:", error);
      alert("Failed to check in. Please try again.");
    }
  };

  const resumeScanning = () => {
    setResult(null);
    setScanning(true);
    if (scanner) {
      scanner.resume();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return "just now";
    if (diffInMinutes < 60)
      return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (!eventData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F3F4F6",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <div style={{ fontSize: "18px", fontWeight: 600 }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "clamp(16px, 4vw, 20px)",
          borderBottom: "3px solid #000000",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <button
            onClick={() => navigate(`/dash/${eventId}`)}
            style={{
              background: "#FFFFFF",
              border: "2px solid #000000",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "2px 2px 0px #000000",
            }}
          >
            ← Back
          </button>
          <h1
            style={{
              fontSize: "clamp(20px, 5vw, 28px)",
              fontWeight: 900,
              color: "#FFFFFF",
              textShadow: "2px 2px 0px rgba(0,0,0,0.3)",
              margin: 0,
            }}
          >
            📸 Scan Tickets
          </h1>
        </div>
      </div>

      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "clamp(20px, 5vw, 40px) clamp(16px, 4vw, 20px)",
        }}
      >
        {!result ? (
          // SCANNING MODE
          <div
            style={{
              background: "#FFFFFF",
              border: "3px solid #000000",
              borderRadius: "16px",
              padding: "clamp(20px, 5vw, 24px)",
              boxShadow: "6px 6px 0px #000000",
            }}
          >
            <h3
              style={{
                fontSize: "clamp(18px, 4.5vw, 20px)",
                fontWeight: 800,
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              📸 Point Camera at QR Code
            </h3>

            {/* Scanner */}
            <div
              id="qr-reader"
              style={{
                border: "3px solid #000000",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            ></div>

            <div
              style={{
                background: "#FFF9DB",
                border: "2px solid #F59E0B",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>
                📱 Hold the ticket's QR code up to your camera
              </p>
            </div>
          </div>
        ) : (
          // RESULT MODE
          <div
            style={{
              background: "#FFFFFF",
              border: "4px solid #000000",
              borderRadius: "20px",
              padding: "clamp(24px, 6vw, 32px)",
              boxShadow: "8px 8px 0px #000000",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "clamp(80px, 20vw, 100px)",
                marginBottom: "16px",
              }}
            >
              {result.icon}
            </div>
            <h2
              style={{
                fontSize: "clamp(24px, 6vw, 32px)",
                fontWeight: 900,
                color: result.color,
                marginBottom: "12px",
              }}
            >
              {result.message}
            </h2>
            <p
              style={{
                fontSize: "clamp(16px, 4vw, 18px)",
                color: "#666",
                marginBottom: "32px",
              }}
            >
              {result.detail}
            </p>

            {result.ticket && (
              <div
                style={{
                  background:
                    result.status === "valid"
                      ? "#D1FAE5"
                      : result.status === "already_checked_in"
                      ? "#FFF9DB"
                      : "#FFE5E5",
                  border: `3px solid ${result.color}`,
                  borderRadius: "12px",
                  padding: "clamp(20px, 5vw, 24px)",
                  marginBottom: "24px",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    fontSize: "clamp(24px, 6vw, 28px)",
                    fontWeight: 900,
                    marginBottom: "16px",
                  }}
                >
                  {result.ticket.buyer_name || "Unknown"}
                </div>
                <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                  📧 {result.ticket.buyer_email || "No email"}
                </div>
                <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                  🎟️ {result.ticket.quantity} ticket
                  {result.ticket.quantity !== 1 ? "s" : ""}
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: 800,
                    color: result.color,
                  }}
                >
                  💰 $
                  {(
                    result.ticket.ticket_price * result.ticket.quantity
                  ).toFixed(2)}{" "}
                  •{" "}
                  {result.status === "valid"
                    ? "Paid"
                    : result.status === "already_checked_in"
                    ? "Already In"
                    : "Not Paid"}
                </div>
                {result.checkedInTime && (
                  <div
                    style={{
                      fontSize: "14px",
                      color: "#666",
                      marginTop: "12px",
                    }}
                  >
                    Checked in {formatTime(result.checkedInTime)}
                  </div>
                )}
              </div>
            )}

            {result.ticketCode && !result.ticket && (
              <div
                style={{
                  background: "#FFE5E5",
                  border: "2px solid #EF4444",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "24px",
                  fontFamily: "monospace",
                  fontSize: "14px",
                }}
              >
                Code: {result.ticketCode}
              </div>
            )}

            {result.status === "valid" ? (
              <button
                onClick={handleCheckIn}
                style={{
                  width: "100%",
                  background: "#10B981",
                  color: "#FFFFFF",
                  border: "4px solid #000000",
                  borderRadius: "16px",
                  padding: "clamp(20px, 5vw, 24px)",
                  fontSize: "clamp(20px, 5vw, 24px)",
                  fontWeight: 900,
                  cursor: "pointer",
                  boxShadow: "8px 8px 0px #000000",
                  marginBottom: "12px",
                  letterSpacing: "2px",
                }}
              >
                ✓ CHECK IN & ADMIT
              </button>
            ) : (
              <div
                style={{
                  background: "#FFE5E5",
                  border: "3px solid #EF4444",
                  borderRadius: "12px",
                  padding: "16px",
                  marginBottom: "12px",
                  fontSize: "clamp(14px, 3.5vw, 16px)",
                  fontWeight: 800,
                  color: "#EF4444",
                }}
              >
                {result.status === "already_checked_in"
                  ? "⚠️ Ticket already used - Do not admit again"
                  : "❌ DO NOT ADMIT"}
              </div>
            )}

            <button
              onClick={resumeScanning}
              style={{
                width: "100%",
                background: "#FFFFFF",
                color: "#000000",
                border: "2px solid #000000",
                borderRadius: "12px",
                padding: "12px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "3px 3px 0px #000000",
              }}
            >
              ← Scan Another Ticket
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;

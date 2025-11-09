import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getTicketByCode } from "../services/ticketService";

const TicketSuccess = () => {
  const { ticketCode } = useParams();
  const location = useLocation();
  const [ticketData, setTicketData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get ticket data from navigation state first
    if (location.state) {
      setTicketData(location.state);
      setLoading(false);
    } else {
      // Otherwise fetch from database
      loadTicket();
    }
  }, [ticketCode, location]);

  const loadTicket = async () => {
    const { data, error } = await getTicketByCode(ticketCode);
    if (!error && data) {
      setTicketData(data);
    }
    setLoading(false);
  };

  const handleDownload = () => {
    if (!ticketData?.qrCodeUrl) return;

    const link = document.createElement("a");
    link.download = `ticket-${ticketCode}.png`;
    link.href = ticketData.qrCodeUrl;
    link.click();
  };

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <div style={{ fontSize: "18px", fontWeight: 600 }}>
          Loading ticket...
        </div>
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>❌</div>
        <div style={{ fontSize: "18px", fontWeight: 600 }}>
          Ticket not found
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
          padding: "20px",
          borderBottom: "3px solid #000000",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h1
            style={{
              fontSize: "clamp(20px, 5vw, 28px)",
              fontWeight: 900,
              color: "#FFFFFF",
              textShadow: "2px 2px 0px rgba(0,0,0,0.3)",
              margin: 0,
            }}
          >
            ✅ Payment Confirmed!
          </h1>
        </div>
      </div>

      <div
        style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}
      >
        {/* Success Message */}
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
            style={{ fontSize: "28px", fontWeight: 900, marginBottom: "12px" }}
          >
            Your Ticket is Ready!
          </h2>
          <p
            style={{ fontSize: "16px", color: "#666666", marginBottom: "32px" }}
          >
            Show this QR code at the door
          </p>

          {/* QR Code */}
          {ticketData.qrCodeUrl && (
            <div
              style={{
                background: "#FFFFFF",
                border: "4px solid #000000",
                borderRadius: "16px",
                padding: "24px",
                margin: "0 auto 24px",
                maxWidth: "350px",
              }}
            >
              <img
                src={ticketData.qrCodeUrl}
                alt="Ticket QR Code"
                style={{
                  width: "100%",
                  height: "auto",
                  display: "block",
                }}
              />
            </div>
          )}

          {/* Ticket Details */}
          <div
            style={{
              background: "#F9FAFB",
              border: "2px solid #E5E7EB",
              borderRadius: "12px",
              padding: "20px",
              marginBottom: "24px",
              textAlign: "left",
            }}
          >
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}
              >
                Event
              </div>
              <div style={{ fontSize: "18px", fontWeight: 800 }}>
                {ticketData.eventName || ticketData.event_name}
              </div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}
              >
                Name
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600 }}>
                {ticketData.buyerName || ticketData.buyer_name}
              </div>
            </div>
            <div style={{ marginBottom: "12px" }}>
              <div
                style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}
              >
                Tickets
              </div>
              <div style={{ fontSize: "16px", fontWeight: 600 }}>
                {ticketData.quantity}
              </div>
            </div>
            <div>
              <div
                style={{ fontSize: "12px", color: "#666", marginBottom: "4px" }}
              >
                Ticket Code
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: 700,
                  fontFamily: "monospace",
                }}
              >
                {ticketCode || ticketData.ticketCode || ticketData.ticket_code}
              </div>
            </div>
          </div>

          {/* Download Button */}
          {ticketData.qrCodeUrl && (
            <button
              onClick={handleDownload}
              style={{
                width: "100%",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#FFFFFF",
                border: "4px solid #000000",
                borderRadius: "16px",
                padding: "16px",
                fontSize: "18px",
                fontWeight: 900,
                cursor: "pointer",
                boxShadow: "6px 6px 0px #000000",
                marginBottom: "12px",
              }}
            >
              📥 Download Ticket
            </button>
          )}
        </div>

        {/* Email Confirmation */}
        <div
          style={{
            background: "#E8F5E9",
            border: "3px solid #10B981",
            borderRadius: "16px",
            padding: "20px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "14px", margin: 0 }}>
            📧 Ticket emailed to{" "}
            <strong>{ticketData.buyerEmail || ticketData.buyer_email}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketSuccess;

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../config/supabase";

const Dashboard = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [eventData, setEventData] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    ticketsSold: 0,
    totalRevenue: 0,
    checkedIn: 0,
    orders: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && eventId) {
      loadEventData();
      loadTickets();
    }
  }, [user, eventId]);

  const loadEventData = async () => {
    try {
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
    } catch (error) {
      console.error("Error loading event:", error);
      navigate("/my-events");
    }
  };

  const loadTickets = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tickets")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading tickets:", error);
      } else {
        setTickets(data || []);

        // Calculate stats - SUM quantities for total tickets
        const totalTickets = data.reduce(
          (sum, ticket) => sum + (ticket.quantity || 0),
          0
        );
        const checkedInTickets = data
          .filter((t) => t.checked_in)
          .reduce((sum, ticket) => sum + (ticket.quantity || 0), 0);
        const totalRevenue = data.reduce((sum, ticket) => {
          return sum + ticket.ticket_price * ticket.quantity;
        }, 0);

        setStats({
          ticketsSold: totalTickets,
          totalRevenue: totalRevenue,
          checkedIn: checkedInTickets,
          orders: data.length, // Number of purchases/orders
        });
      }
    } catch (error) {
      console.error("Error loading tickets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query.toLowerCase());
  };

  const filteredTickets = tickets.filter((ticket) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      ticket.buyer_name?.toLowerCase().includes(searchLower) ||
      ticket.buyer_email?.toLowerCase().includes(searchLower) ||
      ticket.ticket_code?.toLowerCase().includes(searchLower)
    );
  });

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);

    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60)
      return `${diffInMinutes} min${diffInMinutes > 1 ? "s" : ""} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24)
      return `${diffInHours} hour${diffInHours > 1 ? "s" : ""} ago`;

    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  if (!eventData || loading) {
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
          <div style={{ fontSize: "18px", fontWeight: 600 }}>
            Loading dashboard...
          </div>
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
            maxWidth: "1200px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              flex: 1,
              minWidth: 0,
            }}
          >
            <button
              onClick={() => navigate("/my-events")}
              style={{
                background: "#FFFFFF",
                border: "2px solid #000000",
                borderRadius: "8px",
                padding: "8px 16px",
                fontSize: "14px",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "2px 2px 0px #000000",
                flexShrink: 0,
              }}
            >
              ← Back
            </button>
            <h1
              style={{
                fontSize: "clamp(18px, 4.5vw, 28px)",
                fontWeight: 900,
                color: "#FFFFFF",
                textShadow: "2px 2px 0px rgba(0,0,0,0.3)",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              📊 {eventData.event_name}
            </h1>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "clamp(20px, 5vw, 40px) clamp(16px, 4vw, 20px)",
        }}
      >
        {/* Stats Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "clamp(12px, 3vw, 20px)",
            marginBottom: "clamp(24px, 6vw, 32px)",
          }}
        >
          {/* Tickets Sold */}
          <div
            style={{
              background: "#FFFFFF",
              border: "3px solid #000000",
              borderRadius: "16px",
              padding: "clamp(20px, 5vw, 24px)",
              boxShadow: "6px 6px 0px #000000",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#666",
                marginBottom: "8px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              TICKETS SOLD
            </div>
            <div
              style={{
                fontSize: "clamp(32px, 8vw, 36px)",
                fontWeight: 900,
                color: "#000000",
              }}
            >
              {stats.ticketsSold}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#666",
                marginTop: "4px",
              }}
            >
              of {eventData.unlimited ? "∞" : eventData.total_tickets}
            </div>
          </div>

          {/* Revenue */}
          <div
            style={{
              background: "#FFFFFF",
              border: "3px solid #000000",
              borderRadius: "16px",
              padding: "clamp(20px, 5vw, 24px)",
              boxShadow: "6px 6px 0px #000000",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#666",
                marginBottom: "8px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              REVENUE
            </div>
            <div
              style={{
                fontSize: "clamp(32px, 8vw, 36px)",
                fontWeight: 900,
                color: "#10B981",
              }}
            >
              ${stats.totalRevenue.toFixed(0)}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#666",
                marginTop: "4px",
              }}
            >
              ${eventData.ticket_price} per ticket
            </div>
          </div>

          {/* Checked In */}
          <div
            style={{
              background: "#FFFFFF",
              border: "3px solid #000000",
              borderRadius: "16px",
              padding: "clamp(20px, 5vw, 24px)",
              boxShadow: "6px 6px 0px #000000",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#666",
                marginBottom: "8px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              CHECKED IN
            </div>
            <div
              style={{
                fontSize: "clamp(32px, 8vw, 36px)",
                fontWeight: 900,
                color: "#000000",
              }}
            >
              {stats.checkedIn}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#666",
                marginTop: "4px",
              }}
            >
              of {stats.ticketsSold} tickets
            </div>
          </div>

          {/* Purchases */}
          <div
            style={{
              background: "#FFFFFF",
              border: "3px solid #000000",
              borderRadius: "16px",
              padding: "clamp(20px, 5vw, 24px)",
              boxShadow: "6px 6px 0px #000000",
            }}
          >
            <div
              style={{
                fontSize: "12px",
                color: "#666",
                marginBottom: "8px",
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              PURCHASES
            </div>
            <div
              style={{
                fontSize: "clamp(32px, 8vw, 36px)",
                fontWeight: 900,
                color: "#000000",
              }}
            >
              {stats.orders}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#666",
                marginTop: "4px",
              }}
            >
              {stats.orders > 0
                ? (stats.ticketsSold / stats.orders).toFixed(1)
                : "0"}{" "}
              avg per purchase
            </div>
          </div>
        </div>

        {/* QR Scanner Button */}
        <button
          onClick={() => navigate(`/scan/${eventId}`)}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            color: "#FFFFFF",
            border: "4px solid #000000",
            borderRadius: "16px",
            padding: "clamp(16px, 4vw, 20px)",
            fontSize: "clamp(18px, 4.5vw, 20px)",
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "6px 6px 0px #000000",
            marginBottom: "clamp(24px, 6vw, 32px)",
            textTransform: "uppercase",
          }}
        >
          📸 Open QR Scanner
        </button>

        {/* Attendees List */}
        <div
          style={{
            background: "#FFFFFF",
            border: "4px solid #000000",
            borderRadius: "20px",
            padding: "clamp(24px, 6vw, 32px)",
            boxShadow: "8px 8px 0px #000000",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "clamp(16px, 4vw, 24px)",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <h2
              style={{
                fontSize: "clamp(20px, 5vw, 24px)",
                fontWeight: 900,
                margin: 0,
              }}
            >
              <h2
                style={{
                  fontSize: "clamp(20px, 5vw, 24px)",
                  fontWeight: 900,
                  marginBottom: "clamp(16px, 4vw, 24px)",
                }}
              >
                💰 Attendees ({stats.ticketsSold}{" "}
                {stats.ticketsSold === 1 ? "person" : "people"})
              </h2>
            </h2>

            {/* Search */}
            <input
              type="text"
              placeholder="Search by name, email, or code..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              style={{
                padding: "12px 16px",
                border: "3px solid #000000",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                minWidth: "250px",
                flex: "1",
                maxWidth: "400px",
              }}
            />
          </div>

          {filteredTickets.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "clamp(32px, 8vw, 48px)",
                color: "#666",
              }}
            >
              <div
                style={{
                  fontSize: "clamp(48px, 12vw, 60px)",
                  marginBottom: "16px",
                }}
              >
                {searchQuery ? "🔍" : "🎟️"}
              </div>
              <div
                style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 600 }}
              >
                {searchQuery ? "No results found" : "No tickets sold yet"}
              </div>
            </div>
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "16px" }}
            >
              {filteredTickets.map((ticket) => (
                <div
                  key={ticket.id}
                  style={{
                    background: ticket.checked_in ? "#D1FAE5" : "#F9FAFB",
                    border: `3px solid ${
                      ticket.checked_in ? "#10B981" : "#E5E7EB"
                    }`,
                    borderRadius: "12px",
                    padding: "clamp(16px, 4vw, 20px)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div
                        style={{
                          fontSize: "clamp(16px, 4vw, 18px)",
                          fontWeight: 800,
                          marginBottom: "4px",
                        }}
                      >
                        {ticket.buyer_name || "Unknown"}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          color: "#666",
                          marginBottom: "4px",
                        }}
                      >
                        {ticket.buyer_email || "No email"}
                      </div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          marginBottom: "4px",
                        }}
                      >
                        {ticket.quantity} ticket
                        {ticket.quantity !== 1 ? "s" : ""} • $
                        {(ticket.ticket_price * ticket.quantity).toFixed(2)}
                      </div>
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#666",
                          fontFamily: "monospace",
                        }}
                      >
                        {ticket.ticket_code}
                      </div>
                      {ticket.checked_in && ticket.checked_in_at && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "#10B981",
                            marginTop: "6px",
                            fontWeight: 600,
                          }}
                        >
                          ✓ Checked in {formatTime(ticket.checked_in_at)}
                        </div>
                      )}
                    </div>

                    <div
                      style={{
                        background: ticket.checked_in ? "#10B981" : "#F59E0B",
                        color: "#FFFFFF",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        fontWeight: 800,
                        border: "2px solid #000000",
                        flexShrink: 0,
                      }}
                    >
                      {ticket.checked_in
                        ? "✅ Checked In"
                        : "⏳ Not Checked In"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

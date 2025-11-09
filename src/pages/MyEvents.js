import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../config/supabase";

const MyEvents = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadEvents();
    }
  }, [user]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Get all events for this user
      const { data: eventsData, error: eventsError } = await supabase
        .from("events")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (eventsError) {
        console.error("Error loading events:", eventsError);
        setEvents([]);
        setLoading(false);
        return;
      }

      // For each event, SUM the quantity of tickets sold
      const eventsWithTicketCounts = await Promise.all(
        eventsData.map(async (event) => {
          // Sum the quantity field to get total tickets sold
          const { data: ticketsData, error: ticketsError } = await supabase
            .from("tickets")
            .select("quantity")
            .eq("event_id", event.id);

          if (ticketsError) {
            console.error("Error fetching tickets:", ticketsError);
            return { ...event, tickets_sold: 0 };
          }

          // Sum all quantities
          const totalTickets = ticketsData.reduce((sum, ticket) => {
            return sum + (ticket.quantity || 0);
          }, 0);

          return {
            ...event,
            tickets_sold: totalTickets,
          };
        })
      );

      setEvents(eventsWithTicketCounts);
    } catch (error) {
      console.error("Error loading events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Link copied to clipboard! 📋");
  };

  const handleDelete = async (eventId) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this event? This will also delete all tickets."
      )
    ) {
      return;
    }

    try {
      // Delete all tickets first
      await supabase.from("tickets").delete().eq("event_id", eventId);

      // Then delete the event
      const { error } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (error) {
        console.error("Delete error:", error);
        alert("Failed to delete event");
        return;
      }

      // Reload events
      loadEvents();
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete event");
    }
  };

  if (loading) {
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
            Loading your events...
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
            gap: "16px",
          }}
        >
          <h1
            style={{
              fontSize: "clamp(24px, 6vw, 32px)",
              fontWeight: 900,
              color: "#FFFFFF",
              textShadow: "3px 3px 0px rgba(0,0,0,0.3)",
              margin: 0,
            }}
          >
            🎉 My Events
          </h1>
          <button
            onClick={handleSignOut}
            style={{
              background: "#FFFFFF",
              color: "#667eea",
              border: "3px solid #000000",
              borderRadius: "12px",
              padding: "12px 24px",
              fontSize: "16px",
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "4px 4px 0px #000000",
            }}
          >
            Sign Out
          </button>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "clamp(20px, 5vw, 40px) clamp(16px, 4vw, 20px)",
        }}
      >
        {/* Create Event Button */}
        <button
          onClick={() => navigate("/create-event")}
          style={{
            width: "100%",
            background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
            color: "#FFFFFF",
            border: "4px solid #000000",
            borderRadius: "16px",
            padding: "clamp(16px, 4vw, 20px)",
            fontSize: "clamp(18px, 4.5vw, 24px)",
            fontWeight: 900,
            cursor: "pointer",
            boxShadow: "6px 6px 0px #000000",
            marginBottom: "clamp(24px, 6vw, 32px)",
            textTransform: "uppercase",
          }}
        >
          ✨ Create New Event
        </button>

        {/* Events List */}
        {events.length === 0 ? (
          <div
            style={{
              background: "#FFFFFF",
              border: "3px solid #000000",
              borderRadius: "16px",
              padding: "clamp(32px, 8vw, 48px)",
              boxShadow: "6px 6px 0px #000000",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "clamp(60px, 15vw, 80px)",
                marginBottom: "16px",
              }}
            >
              🎪
            </div>
            <h2
              style={{
                fontSize: "clamp(20px, 5vw, 24px)",
                fontWeight: 900,
                marginBottom: "12px",
              }}
            >
              No Events Yet
            </h2>
            <p style={{ fontSize: "clamp(14px, 3.5vw, 16px)", color: "#666" }}>
              Create your first event to start selling tickets!
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "clamp(16px, 4vw, 24px)",
            }}
          >
            {events.map((event) => {
              const ticketLink = `${window.location.origin}/${
                event.stripe_account_id ? "stripe-pay" : "pay"
              }/${event.id}`;
              const dashboardLink = `/dash/${event.id}`;
              const soldPercentage = event.unlimited
                ? 0
                : Math.round((event.tickets_sold / event.total_tickets) * 100);

              return (
                <div
                  key={event.id}
                  style={{
                    background: "#FFFFFF",
                    border: "4px solid #000000",
                    borderRadius: "20px",
                    padding: "clamp(20px, 5vw, 24px)",
                    boxShadow: "6px 6px 0px #000000",
                    position: "relative",
                  }}
                >
                  {/* Event Name */}
                  <h3
                    style={{
                      fontSize: "clamp(18px, 4.5vw, 22px)",
                      fontWeight: 900,
                      marginBottom: "12px",
                      wordBreak: "break-word",
                    }}
                  >
                    📌 {event.event_name}
                  </h3>

                  {/* Price */}
                  <div
                    style={{
                      fontSize: "clamp(16px, 4vw, 20px)",
                      fontWeight: 800,
                      color: "#667eea",
                      marginBottom: "16px",
                    }}
                  >
                    ${event.ticket_price} per ticket
                  </div>

                  {/* Tickets Sold */}
                  <div
                    style={{
                      background: "#F9FAFB",
                      border: "2px solid #E5E7EB",
                      borderRadius: "12px",
                      padding: "16px",
                      marginBottom: "16px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "12px",
                      }}
                    >
                      <span style={{ fontSize: "16px", fontWeight: 700 }}>
                        🎟️ {event.tickets_sold} /{" "}
                        {event.unlimited ? "∞" : event.total_tickets} sold
                      </span>
                      {!event.unlimited && (
                        <span
                          style={{
                            fontSize: "16px",
                            fontWeight: 900,
                            color: soldPercentage >= 80 ? "#EF4444" : "#667eea",
                          }}
                        >
                          {soldPercentage}%
                        </span>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {!event.unlimited && (
                      <div
                        style={{
                          width: "100%",
                          height: "10px",
                          background: "#E5E7EB",
                          borderRadius: "6px",
                          overflow: "hidden",
                          border: "2px solid #000000",
                        }}
                      >
                        <div
                          style={{
                            width: `${soldPercentage}%`,
                            height: "100%",
                            background:
                              soldPercentage >= 80
                                ? "linear-gradient(90deg, #EF4444 0%, #DC2626 100%)"
                                : "linear-gradient(90deg, #667eea 0%, #764ba2 100%)",
                            transition: "width 0.3s ease",
                          }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {/* Created Date */}
                  <div
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginBottom: "16px",
                    }}
                  >
                    Created {new Date(event.created_at).toLocaleDateString()}
                  </div>

                  {/* Action Buttons */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "8px",
                      marginBottom: "8px",
                    }}
                  >
                    <button
                      onClick={() => navigate(dashboardLink)}
                      style={{
                        background:
                          "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        color: "#FFFFFF",
                        border: "3px solid #000000",
                        borderRadius: "12px",
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow: "3px 3px 0px #000000",
                      }}
                    >
                      📊 Dashboard
                    </button>
                    <button
                      onClick={() => copyToClipboard(ticketLink)}
                      style={{
                        background: "#FFFFFF",
                        color: "#000000",
                        border: "3px solid #000000",
                        borderRadius: "12px",
                        padding: "12px",
                        fontSize: "14px",
                        fontWeight: 800,
                        cursor: "pointer",
                        boxShadow: "3px 3px 0px #000000",
                      }}
                    >
                      📋 Copy Link
                    </button>
                  </div>

                  <button
                    onClick={() => handleDelete(event.id)}
                    style={{
                      width: "100%",
                      background: "#FFE5E5",
                      color: "#EF4444",
                      border: "2px solid #EF4444",
                      borderRadius: "12px",
                      padding: "10px",
                      fontSize: "14px",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyEvents;

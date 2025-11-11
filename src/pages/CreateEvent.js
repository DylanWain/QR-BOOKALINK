import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { createEvent } from "../services/eventService";
import { createConnectAccount } from "../services/stripeService";

const CreateEvent = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [connectingStripe, setConnectingStripe] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState(null);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    eventName: "",
    ticketPrice: "",
    totalTickets: "",
    unlimited: false,
    hostEmail: user?.email || "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    // Check if returning from Stripe Connect
    if (searchParams.get("stripe_connected") === "true") {
      alert("Stripe connected successfully! ✅");
    }
  }, [user, navigate, searchParams]);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError("");
  };

  const handleUnlimitedToggle = () => {
    setFormData({
      ...formData,
      unlimited: !formData.unlimited,
      totalTickets: !formData.unlimited ? "" : formData.totalTickets,
    });
  };

  const handleStripeConnect = async () => {
    if (!formData.hostEmail) {
      setError("Please enter your email first");
      return;
    }

    setConnectingStripe(true);
    setError("");

    try {
      console.log('🚀 Starting Stripe Connect for:', formData.hostEmail);

      // Create Stripe Express account AND get onboarding link in one call
      const { account, link, error: stripeError } = await createConnectAccount(
        formData.hostEmail,
        user?.id
      );

      if (stripeError) {
        console.error('❌ Stripe error:', stripeError);
        setError(`Failed to create Stripe account: ${stripeError}`);
        setConnectingStripe(false);
        return;
      }

      if (!account || !link) {
        console.error('❌ Missing account or link:', { account, link });
        setError("Failed to setup Stripe. Please try again.");
        setConnectingStripe(false);
        return;
      }

      console.log('✅ Stripe account created:', account.id);
      console.log('✅ Redirecting to:', link.url);

      // Save account ID
      setStripeAccountId(account.id);

      // Redirect to Stripe onboarding
      window.location.href = link.url;
    } catch (err) {
      console.error('💥 Unexpected error:', err);
      setError("Failed to connect Stripe. Please try again.");
      setConnectingStripe(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.eventName.trim()) {
      setError("Please enter an event name");
      return;
    }

    if (!formData.ticketPrice || parseFloat(formData.ticketPrice) <= 0) {
      setError("Please enter a valid ticket price");
      return;
    }

    if (
      !formData.unlimited &&
      (!formData.totalTickets || parseInt(formData.totalTickets) <= 0)
    ) {
      setError("Please enter number of tickets or select unlimited");
      return;
    }

    if (!formData.hostEmail.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!stripeAccountId) {
      setError("Please connect your Stripe account to receive payments");
      return;
    }

    setLoading(true);

    try {
      const eventDataToCreate = {
        ...formData,
        stripeAccountId: stripeAccountId,
        stripeAccountStatus: "connected",
      };

      const { data, error } = await createEvent(eventDataToCreate, user.id);

      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }

      navigate(`/event-created/${data.id}`);
    } catch (err) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

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
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "16px",
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
            }}
          >
            ← Back
          </button>
          <h1
            style={{
              fontSize: "clamp(24px, 6vw, 32px)",
              fontWeight: 900,
              color: "#FFFFFF",
              textShadow: "3px 3px 0px rgba(0,0,0,0.3)",
              margin: 0,
            }}
          >
            🎉 Create Event
          </h1>
        </div>
      </div>

      <div
        style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}
      >
        {/* Main Card */}
        <div
          style={{
            background: "#FFFFFF",
            border: "4px solid #000000",
            borderRadius: "20px",
            padding: "40px",
            boxShadow: "8px 8px 0px #000000",
          }}
        >
          <h2
            style={{ fontSize: "28px", fontWeight: 900, marginBottom: "12px" }}
          >
            Create Your Event
          </h2>
          <p
            style={{ fontSize: "16px", color: "#666666", marginBottom: "32px" }}
          >
            Start selling tickets in 30 seconds
          </p>

          <form onSubmit={handleSubmit}>
            {/* Event Name */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                Event Name
              </label>
              <input
                type="text"
                placeholder="Summer Concert 2025"
                value={formData.eventName}
                onChange={(e) => handleChange("eventName", e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px",
                  border: "3px solid #000000",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Ticket Price */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                Ticket Price
              </label>
              <div style={{ position: "relative" }}>
                <span
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontSize: "18px",
                    fontWeight: 700,
                  }}
                >
                  $
                </span>
                <input
                  type="number"
                  placeholder="25"
                  min="1"
                  step="0.01"
                  value={formData.ticketPrice}
                  onChange={(e) => handleChange("ticketPrice", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "16px 16px 16px 40px",
                    border: "3px solid #000000",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>
            </div>

            {/* Total Tickets */}
            <div style={{ marginBottom: "24px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                Number of Tickets
              </label>

              {/* Unlimited Checkbox */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "12px",
                  cursor: "pointer",
                }}
                onClick={handleUnlimitedToggle}
              >
                <div
                  style={{
                    width: "24px",
                    height: "24px",
                    border: "3px solid #000000",
                    borderRadius: "6px",
                    marginRight: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: formData.unlimited ? "#667eea" : "#FFFFFF",
                    cursor: "pointer",
                  }}
                >
                  {formData.unlimited && (
                    <span
                      style={{
                        color: "#FFFFFF",
                        fontSize: "16px",
                        fontWeight: 900,
                      }}
                    >
                      ✓
                    </span>
                  )}
                </div>
                <span
                  style={{
                    fontSize: "16px",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Unlimited Tickets
                </span>
              </div>

              {/* Ticket Number Input */}
              {!formData.unlimited && (
                <input
                  type="number"
                  placeholder="100"
                  min="1"
                  value={formData.totalTickets}
                  onChange={(e) => handleChange("totalTickets", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "16px",
                    border: "3px solid #000000",
                    borderRadius: "12px",
                    fontSize: "16px",
                    fontWeight: 600,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              )}
            </div>

            {/* Host Email */}
            <div style={{ marginBottom: "32px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                Your Email
              </label>
              <input
                type="email"
                placeholder="you@email.com"
                value={formData.hostEmail}
                onChange={(e) => handleChange("hostEmail", e.target.value)}
                style={{
                  width: "100%",
                  padding: "16px",
                  border: "3px solid #000000",
                  borderRadius: "12px",
                  fontSize: "16px",
                  fontWeight: 600,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>

            {/* Stripe Connect */}
            <div style={{ marginBottom: "32px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "16px",
                  fontWeight: 700,
                }}
              >
                Connect Payment Account
              </label>

              {!stripeAccountId ? (
                <button
                  type="button"
                  onClick={handleStripeConnect}
                  disabled={connectingStripe || !formData.hostEmail}
                  style={{
                    width: "100%",
                    background: connectingStripe
                      ? "#CCCCCC"
                      : "linear-gradient(135deg, #635BFF 0%, #4F46E5 100%)",
                    color: "#FFFFFF",
                    border: "3px solid #000000",
                    borderRadius: "12px",
                    padding: "16px",
                    fontSize: "16px",
                    fontWeight: 800,
                    cursor:
                      connectingStripe || !formData.hostEmail
                        ? "not-allowed"
                        : "pointer",
                    boxShadow: "4px 4px 0px #000000",
                  }}
                >
                  {connectingStripe
                    ? "⏳ Connecting..."
                    : "🔗 Connect Stripe to Receive Payments"}
                </button>
              ) : (
                <div
                  style={{
                    background: "#D1FAE5",
                    border: "3px solid #10B981",
                    borderRadius: "12px",
                    padding: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: "16px",
                        fontWeight: 800,
                        color: "#10B981",
                      }}
                    >
                      ✅ Stripe Connected
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#666",
                        marginTop: "4px",
                      }}
                    >
                      You'll receive payments automatically
                    </div>
                  </div>
                </div>
              )}

              <p style={{ fontSize: "12px", color: "#666", marginTop: "8px" }}>
                💰 You'll receive ${formData.ticketPrice || "10"} per ticket (we
                keep $1 service fee)
              </p>
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  background: "#FFE5E5",
                  border: "2px solid #EF4444",
                  borderRadius: "12px",
                  padding: "12px",
                  marginBottom: "20px",
                  color: "#EF4444",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !stripeAccountId}
              style={{
                width: "100%",
                background:
                  loading || !stripeAccountId
                    ? "#CCCCCC"
                    : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "#FFFFFF",
                border: "4px solid #000000",
                borderRadius: "16px",
                padding: "20px",
                fontSize: "20px",
                fontWeight: 900,
                cursor: loading || !stripeAccountId ? "not-allowed" : "pointer",
                boxShadow: "6px 6px 0px #000000",
                textTransform: "uppercase",
              }}
            >
              {loading ? "⏳ Creating..." : "✨ Create Event"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateEvent;

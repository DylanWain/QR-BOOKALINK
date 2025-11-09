import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { stripePromise } from "../config/stripe";
import { getEvent } from "../services/eventService";
import { createPaymentIntent } from "../services/stripeService";
import { handlePaymentSuccess } from "../services/paymentService";
import { calculateFees } from "../utils/feeCalculator";

const CheckoutForm = ({ eventData, eventId }) => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const [formData, setFormData] = useState({
    buyerName: "",
    buyerEmail: "",
    quantity: 1,
  });
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError("");
  };

  const fees = calculateFees(
    parseFloat(eventData.ticket_price),
    parseInt(formData.quantity)
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.buyerName.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!formData.buyerEmail.trim() || !formData.buyerEmail.includes("@")) {
      setError("Please enter a valid email");
      return;
    }

    if (!stripe || !elements) {
      setError("Stripe not loaded. Please refresh the page.");
      return;
    }

    setProcessing(true);
    setError("");

    try {
      // Create payment intent with application fee
      const { intent, error: intentError } = await createPaymentIntent(
        fees.totalBuyerPays,
        eventData.stripe_account_id,
        fees.eventLinkFee
      );

      if (intentError) {
        throw new Error("Failed to create payment. Please try again.");
      }

      // Confirm the payment
      const { error: confirmError, paymentIntent } =
        await stripe.confirmCardPayment(intent.client_secret, {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: formData.buyerName,
              email: formData.buyerEmail,
            },
          },
        });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Payment succeeded - create ticket with buyer info
      const result = await handlePaymentSuccess(
        {
          id: paymentIntent.id,
          purchase_units: [
            {
              amount: {
                value: fees.totalBuyerPays.toFixed(2),
              },
            },
          ],
        },
        eventId,
        {
          name: formData.buyerName,
          email: formData.buyerEmail,
        },
        formData.quantity
      );

      if (result.success) {
        navigate(`/ticket/${result.ticketCode}`, {
          state: {
            ticketCode: result.ticketCode,
            qrCodeUrl: result.qrCodeUrl,
            eventName: eventData.event_name,
            buyerName: formData.buyerName,
            buyerEmail: formData.buyerEmail,
            quantity: formData.quantity,
            totalPaid: fees.totalBuyerPays,
          },
        });
      } else {
        throw new Error(result.error || "Failed to create ticket");
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Payment failed. Please try again.");
      setProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3
        style={{
          fontSize: "clamp(18px, 4vw, 20px)",
          fontWeight: 800,
          marginBottom: "20px",
        }}
      >
        Your Information
      </h3>

      {/* Name */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Your Name *
        </label>
        <input
          type="text"
          placeholder="Sarah Johnson"
          value={formData.buyerName}
          onChange={(e) => handleChange("buyerName", e.target.value)}
          disabled={processing}
          required
          style={{
            width: "100%",
            padding: "clamp(12px, 3vw, 14px)",
            border: "3px solid #000000",
            borderRadius: "12px",
            fontSize: "clamp(14px, 3.5vw, 16px)",
            fontWeight: 600,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Email */}
      <div style={{ marginBottom: "16px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Your Email *
        </label>
        <input
          type="email"
          placeholder="sarah@email.com"
          value={formData.buyerEmail}
          onChange={(e) => handleChange("buyerEmail", e.target.value)}
          disabled={processing}
          required
          style={{
            width: "100%",
            padding: "clamp(12px, 3vw, 14px)",
            border: "3px solid #000000",
            borderRadius: "12px",
            fontSize: "clamp(14px, 3.5vw, 16px)",
            fontWeight: 600,
            fontFamily: "inherit",
            boxSizing: "border-box",
          }}
        />
        <p
          style={{
            fontSize: "12px",
            color: "#666",
            marginTop: "6px",
            margin: 0,
          }}
        >
          📧 Your ticket will be sent here
        </p>
      </div>

      {/* Quantity */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Number of Tickets
        </label>
        <select
          value={formData.quantity}
          onChange={(e) => handleChange("quantity", e.target.value)}
          disabled={processing}
          style={{
            width: "100%",
            padding: "clamp(12px, 3vw, 14px)",
            border: "3px solid #000000",
            borderRadius: "12px",
            fontSize: "clamp(14px, 3.5vw, 16px)",
            fontWeight: 600,
            fontFamily: "inherit",
            cursor: "pointer",
            boxSizing: "border-box",
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <option key={num} value={num}>
              {num}
            </option>
          ))}
        </select>
      </div>

      {/* Card Element */}
      <div style={{ marginBottom: "20px" }}>
        <label
          style={{
            display: "block",
            marginBottom: "8px",
            fontSize: "14px",
            fontWeight: 700,
          }}
        >
          Card Information *
        </label>
        <div
          style={{
            padding: "clamp(14px, 3.5vw, 16px)",
            border: "3px solid #000000",
            borderRadius: "12px",
            background: "#FFFFFF",
          }}
        >
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#000000",
                  "::placeholder": {
                    color: "#999999",
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Price Breakdown */}
      <div
        style={{
          background: "#F9FAFB",
          border: "2px solid #E5E7EB",
          borderRadius: "12px",
          padding: "clamp(14px, 3.5vw, 16px)",
          marginBottom: "20px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
            fontSize: "clamp(13px, 3.2vw, 14px)",
          }}
        >
          <span>
            {fees.quantity} × ${fees.ticketPrice.toFixed(2)}
          </span>
          <span style={{ fontWeight: 600 }}>${fees.subtotal.toFixed(2)}</span>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "12px",
            fontSize: "clamp(13px, 3.2vw, 14px)",
          }}
        >
          <span style={{ color: "#666" }}>Service Fee</span>
          <span style={{ fontWeight: 600 }}>
            ${fees.eventLinkFee.toFixed(2)}
          </span>
        </div>
        <div
          style={{
            borderTop: "2px solid #E5E7EB",
            paddingTop: "12px",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 900 }}>
            Total
          </span>
          <span style={{ fontSize: "clamp(16px, 4vw, 18px)", fontWeight: 900 }}>
            ${fees.totalBuyerPays.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            background: "#FFE5E5",
            border: "2px solid #EF4444",
            borderRadius: "12px",
            padding: "12px",
            marginBottom: "16px",
            color: "#EF4444",
            fontSize: "clamp(13px, 3.2vw, 14px)",
            fontWeight: 600,
          }}
        >
          ⚠️ {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          width: "100%",
          background:
            processing || !stripe
              ? "#CCCCCC"
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "#FFFFFF",
          border: "4px solid #000000",
          borderRadius: "16px",
          padding: "clamp(16px, 4vw, 20px)",
          fontSize: "clamp(16px, 4vw, 20px)",
          fontWeight: 900,
          cursor: processing || !stripe ? "not-allowed" : "pointer",
          boxShadow: "6px 6px 0px #000000",
          boxSizing: "border-box",
        }}
      >
        {processing
          ? "⏳ Processing..."
          : `💳 Pay $${fees.totalBuyerPays.toFixed(2)}`}
      </button>

      {/* Powered by Stripe */}
      <div
        style={{
          textAlign: "center",
          marginTop: "12px",
          fontSize: "12px",
          color: "#666",
        }}
      >
        🔒 Secured by Stripe
      </div>
    </form>
  );
};

const StripePaymentPage = () => {
  const { eventId } = useParams();
  const [eventData, setEventData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    const { data, error } = await getEvent(eventId);
    if (error) {
      setError("Event not found");
    } else {
      if (!data.stripe_account_id) {
        setError("This event is not set up to accept payments yet");
      }
      setEventData(data);
    }
    setLoading(false);
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
          padding: "20px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <div style={{ fontSize: "16px", fontWeight: 600 }}>
            Loading event...
          </div>
        </div>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#F3F4F6",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            border: "3px solid #000000",
            borderRadius: "16px",
            padding: "32px",
            boxShadow: "6px 6px 0px #000000",
            textAlign: "center",
            maxWidth: "400px",
          }}
        >
          <div style={{ fontSize: "60px", marginBottom: "16px" }}>😕</div>
          <div
            style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}
          >
            {error || "Event not found"}
          </div>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Please check the link and try again.
          </p>
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
            🎫 Get Your Tickets
          </h1>
        </div>
      </div>

      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "clamp(20px, 5vw, 40px) clamp(16px, 4vw, 20px)",
        }}
      >
        {/* Event Info */}
        <div
          style={{
            background: "#FFFFFF",
            border: "3px solid #000000",
            borderRadius: "16px",
            padding: "clamp(20px, 5vw, 24px)",
            boxShadow: "6px 6px 0px #000000",
            marginBottom: "clamp(20px, 5vw, 24px)",
            textAlign: "center",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(22px, 5.5vw, 28px)",
              fontWeight: 900,
              marginBottom: "8px",
              wordBreak: "break-word",
            }}
          >
            {eventData.event_name}
          </h2>
          <div
            style={{
              fontSize: "clamp(20px, 5vw, 24px)",
              fontWeight: 800,
              color: "#667eea",
            }}
          >
            ${eventData.ticket_price} per ticket
          </div>
        </div>

        {/* Payment Form */}
        <div
          style={{
            background: "#FFFFFF",
            border: "4px solid #000000",
            borderRadius: "20px",
            padding: "clamp(24px, 6vw, 32px)",
            boxShadow: "8px 8px 0px #000000",
          }}
        >
          <Elements stripe={stripePromise}>
            <CheckoutForm eventData={eventData} eventId={eventId} />
          </Elements>
        </div>
      </div>
    </div>
  );
};

export default StripePaymentPage;

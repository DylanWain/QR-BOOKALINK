import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { getEvent } from "../services/eventService";
import { handlePaymentSuccess } from "../services/paymentService";
import { calculateFees } from "../utils/feeCalculator";

const PaymentPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [formData, setFormData] = useState({
    buyerName: "",
    buyerEmail: "",
    quantity: 1,
  });
  const [error, setError] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    const { data, error } = await getEvent(eventId);
    if (error) {
      setError("Event not found");
    } else {
      setEventData(data);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError("");
  };

  const handlePayPalSuccess = async (orderData) => {
    setProcessing(true);
    try {
      const result = await handlePaymentSuccess(
        orderData,
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
            quantity: formData.quantity,
          },
        });
      }
    } catch (error) {
      setError(
        "Payment processed but ticket creation failed. Please contact support."
      );
      setProcessing(false);
    }
  };

  if (!eventData) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
        <div style={{ fontSize: "18px", fontWeight: 600 }}>
          {error || "Loading event..."}
        </div>
      </div>
    );
  }

  const fees = calculateFees(
    parseFloat(eventData.ticket_price),
    parseInt(formData.quantity)
  );

  const initialOptions = {
    clientId: process.env.REACT_APP_PAYPAL_CLIENT_ID,
    currency: "USD",
    intent: "capture",
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
        style={{ maxWidth: "600px", margin: "0 auto", padding: "40px 20px" }}
      >
        {/* Event Info */}
        <div
          style={{
            background: "#FFFFFF",
            border: "3px solid #000000",
            borderRadius: "16px",
            padding: "24px",
            boxShadow: "6px 6px 0px #000000",
            marginBottom: "24px",
            textAlign: "center",
          }}
        >
          <h2
            style={{ fontSize: "28px", fontWeight: 900, marginBottom: "8px" }}
          >
            {eventData.event_name}
          </h2>
          <div style={{ fontSize: "24px", fontWeight: 800, color: "#667eea" }}>
            ${eventData.ticket_price} per ticket
          </div>
        </div>

        {/* Purchase Form */}
        <div
          style={{
            background: "#FFFFFF",
            border: "4px solid #000000",
            borderRadius: "20px",
            padding: "32px",
            boxShadow: "8px 8px 0px #000000",
            marginBottom: "24px",
          }}
        >
          <h3
            style={{ fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}
          >
            Your Information
          </h3>

          {/* Name */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              Your Name
            </label>
            <input
              type="text"
              placeholder="John Smith"
              value={formData.buyerName}
              onChange={(e) => handleChange("buyerName", e.target.value)}
              disabled={processing}
              style={{
                width: "100%",
                padding: "14px",
                border: "3px solid #000000",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "8px",
                fontSize: "14px",
                fontWeight: 700,
              }}
            >
              Your Email
            </label>
            <input
              type="email"
              placeholder="john@email.com"
              value={formData.buyerEmail}
              onChange={(e) => handleChange("buyerEmail", e.target.value)}
              disabled={processing}
              style={{
                width: "100%",
                padding: "14px",
                border: "3px solid #000000",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Quantity */}
          <div style={{ marginBottom: "24px" }}>
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
                padding: "14px",
                border: "3px solid #000000",
                borderRadius: "12px",
                fontSize: "16px",
                fontWeight: 600,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          {/* Price Breakdown */}
          <div
            style={{
              background: "#F9FAFB",
              border: "2px solid #E5E7EB",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "8px",
              }}
            >
              <span style={{ fontSize: "14px" }}>
                {fees.quantity} × ${fees.ticketPrice.toFixed(2)}
              </span>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>
                ${fees.subtotal.toFixed(2)}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "12px",
              }}
            >
              <span style={{ fontSize: "14px", color: "#666" }}>
                Service Fee
              </span>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>
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
              <span style={{ fontSize: "18px", fontWeight: 900 }}>Total</span>
              <span style={{ fontSize: "18px", fontWeight: 900 }}>
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
                marginBottom: "20px",
                color: "#EF4444",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {/* PayPal Buttons */}
          {formData.buyerName && formData.buyerEmail && !processing ? (
            <PayPalScriptProvider options={initialOptions}>
              <PayPalButtons
                style={{
                  layout: "vertical",
                  color: "blue",
                  shape: "rect",
                  label: "pay",
                  height: 55,
                }}
                disableFunding={["paylater", "credit"]}
                createOrder={(data, actions) => {
                  return actions.order.create({
                    purchase_units: [
                      {
                        amount: {
                          currency_code: "USD",
                          value: fees.totalBuyerPays.toFixed(2),
                          breakdown: {
                            item_total: {
                              currency_code: "USD",
                              value: fees.subtotal.toFixed(2),
                            },
                            handling: {
                              currency_code: "USD",
                              value: fees.eventLinkFee.toFixed(2),
                            },
                          },
                        },
                        description: `${eventData.event_name} - ${fees.quantity} ticket(s)`,
                        custom_id: JSON.stringify({
                          eventId,
                          buyerEmail: formData.buyerEmail,
                          quantity: fees.quantity,
                        }),
                      },
                    ],
                  });
                }}
                onApprove={async (data, actions) => {
                  const details = await actions.order.capture();
                  handlePayPalSuccess(details);
                }}
                onError={(err) => {
                  console.error("PayPal Error:", err);
                  setError("Payment failed. Please try again.");
                }}
              />
            </PayPalScriptProvider>
          ) : processing ? (
            <div
              style={{
                background: "#FFF9DB",
                border: "2px solid #F59E0B",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              ⏳ Processing your ticket...
            </div>
          ) : (
            <div
              style={{
                background: "#FFF9DB",
                border: "2px solid #F59E0B",
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
                fontSize: "14px",
                fontWeight: 600,
              }}
            >
              Please fill out your information above
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

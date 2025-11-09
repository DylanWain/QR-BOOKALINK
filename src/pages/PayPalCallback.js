import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const PayPalCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get("code");

      if (!code) {
        alert("PayPal connection failed. Please try again.");
        navigate("/");
        return;
      }

      // For MVP, simulate merchant ID (in production, exchange code with backend)
      const mockMerchantId =
        "MERCHANT_" + Math.random().toString(36).substr(2, 9);

      // Save merchant ID
      localStorage.setItem("paypalMerchantId", mockMerchantId);

      // Show success
      alert("✅ PayPal Connected Successfully!");

      // Go back to create event page
      navigate("/");
    };

    handleCallback();
  }, [searchParams, navigate]);

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
        <div style={{ fontSize: "64px", marginBottom: "16px" }}>⏳</div>
        <div style={{ fontSize: "20px", fontWeight: 700 }}>
          Connecting PayPal...
        </div>
      </div>
    </div>
  );
};

export default PayPalCallback;

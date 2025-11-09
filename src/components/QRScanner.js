import React, { useState, useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

const QRScanner = ({ eventId, tickets, onClose, onCheckIn }) => {
  const [scanning, setScanning] = useState(true);
  const [currentScan, setCurrentScan] = useState(null);
  const [scannerKey, setScannerKey] = useState(0);

  useEffect(() => {
    if (!scanning) return;

    let scanner = null;
    const timer = setTimeout(() => {
      const element = document.getElementById("qr-reader");
      if (!element) return;

      scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        false
      );

      scanner.render(
        (decodedText) => {
          try {
            const scannedData = JSON.parse(decodedText);

            // Find ticket in the tickets array
            const ticket = tickets.find(
              (t) => t.ticket_code === scannedData.ticketCode
            );

            if (ticket) {
              setCurrentScan({
                ...ticket,
                scannedAt: new Date().toLocaleTimeString(),
              });
            } else {
              setCurrentScan({
                ticket_code: scannedData.ticketCode,
                invalid: true,
                scannedAt: new Date().toLocaleTimeString(),
              });
            }

            setScanning(false);
            if (scanner) {
              scanner.clear().catch((err) => console.error(err));
            }
          } catch (err) {
            console.error("Invalid QR code:", err);
            setCurrentScan({
              invalid: true,
              ticket_code: "Invalid QR Code",
              scannedAt: new Date().toLocaleTimeString(),
            });
            setScanning(false);
            if (scanner) {
              scanner.clear().catch((err) => console.error(err));
            }
          }
        },
        (error) => {
          // Silent - scanner continuously retries
        }
      );
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scanner) {
        scanner.clear().catch((err) => console.error(err));
      }
    };
  }, [scanning, scannerKey, tickets]);

  const handleCheckIn = () => {
    onCheckIn(currentScan.ticket_code);
    setCurrentScan(null);
    setScannerKey((prev) => prev + 1);
    setScanning(true);
  };

  const handleScanAnother = () => {
    setCurrentScan(null);
    setScannerKey((prev) => prev + 1);
    setScanning(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F3F4F6" }}>
      {/* Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          padding: "20px",
          borderBottom: "3px solid #000000",
          position: "sticky",
          top: 0,
          zIndex: 100,
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
            onClick={onClose}
            style={{
              background: "#FFFFFF",
              border: "2px solid #000000",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "16px",
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
              flex: 1,
              textShadow: "2px 2px 0px rgba(0,0,0,0.3)",
              margin: 0,
            }}
          >
            📸 Scan Tickets
          </h1>
        </div>
      </div>

      <div
        style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px" }}
      >
        {!currentScan ? (
          /* Scanner Active */
          <div
            style={{
              background: "#FFFFFF",
              border: "3px solid #000000",
              borderRadius: "16px",
              padding: "24px",
              boxShadow: "6px 6px 0px #000000",
              marginBottom: "32px",
            }}
          >
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 800,
                marginBottom: "16px",
                textAlign: "center",
              }}
            >
              📸 Point Camera at QR Code
            </h3>

            {/* Scanner Container */}
            <div
              key={scannerKey}
              id="qr-reader"
              style={{
                border: "3px solid #000000",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "16px",
              }}
            ></div>

            {/* Instructions */}
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
          /* Scan Result */
          <div
            style={{
              background: "#FFFFFF",
              border: "4px solid #000000",
              borderRadius: "20px",
              padding: "32px",
              boxShadow: "8px 8px 0px #000000",
              marginBottom: "32px",
            }}
          >
            {currentScan.invalid ? (
              /* Invalid Ticket */
              <>
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <div style={{ fontSize: "100px", marginBottom: "16px" }}>
                    ❌
                  </div>
                  <h2
                    style={{
                      fontSize: "32px",
                      fontWeight: 900,
                      color: "#EF4444",
                      marginBottom: "12px",
                    }}
                  >
                    INVALID TICKET
                  </h2>
                  <p style={{ fontSize: "18px", color: "#666666" }}>
                    This QR code is not valid for this event
                  </p>
                </div>

                <div
                  style={{
                    background: "#FFE5E5",
                    border: "3px solid #EF4444",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "24px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      marginBottom: "8px",
                    }}
                  >
                    Scanned Code:
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontFamily: "monospace",
                      wordBreak: "break-all",
                      fontWeight: 600,
                    }}
                  >
                    {currentScan.ticket_code}
                  </div>
                </div>

                <button
                  onClick={handleScanAnother}
                  style={{
                    width: "100%",
                    background: "#EF4444",
                    color: "#FFFFFF",
                    border: "4px solid #000000",
                    borderRadius: "16px",
                    padding: "20px",
                    fontSize: "20px",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "6px 6px 0px #000000",
                    textTransform: "uppercase",
                  }}
                >
                  ❌ DO NOT ADMIT - Scan Next
                </button>
              </>
            ) : currentScan.checked_in ? (
              /* Already Checked In */
              <>
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <div style={{ fontSize: "100px", marginBottom: "16px" }}>
                    ⚠️
                  </div>
                  <h2
                    style={{
                      fontSize: "32px",
                      fontWeight: 900,
                      color: "#F59E0B",
                      marginBottom: "12px",
                    }}
                  >
                    ALREADY CHECKED IN
                  </h2>
                  <p style={{ fontSize: "18px", color: "#666666" }}>
                    This ticket was already scanned
                  </p>
                </div>

                <div
                  style={{
                    background: "#F3F4F6",
                    border: "3px solid #000000",
                    borderRadius: "12px",
                    padding: "24px",
                    marginBottom: "24px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "24px",
                      fontWeight: 900,
                      marginBottom: "16px",
                    }}
                  >
                    {currentScan.buyer_name}
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      color: "#666666",
                      marginBottom: "8px",
                    }}
                  >
                    📧 {currentScan.buyer_email}
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      color: "#666666",
                      marginBottom: "8px",
                    }}
                  >
                    🎟️ {currentScan.quantity}{" "}
                    {currentScan.quantity === 1 ? "ticket" : "tickets"}
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#F59E0B",
                    }}
                  >
                    ⏰ Checked in:{" "}
                    {currentScan.checked_in_at
                      ? new Date(currentScan.checked_in_at).toLocaleString()
                      : "Previously"}
                  </div>
                </div>

                <button
                  onClick={handleScanAnother}
                  style={{
                    width: "100%",
                    background: "#F59E0B",
                    color: "#FFFFFF",
                    border: "4px solid #000000",
                    borderRadius: "16px",
                    padding: "20px",
                    fontSize: "20px",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "6px 6px 0px #000000",
                    textTransform: "uppercase",
                  }}
                >
                  ⚠️ Scan Next Ticket
                </button>
              </>
            ) : (
              /* Valid - Ready to Check In */
              <>
                <div style={{ textAlign: "center", marginBottom: "24px" }}>
                  <div style={{ fontSize: "100px", marginBottom: "16px" }}>
                    ✅
                  </div>
                  <h2
                    style={{
                      fontSize: "32px",
                      fontWeight: 900,
                      color: "#10B981",
                      marginBottom: "12px",
                    }}
                  >
                    VERIFIED - ADMIT
                  </h2>
                  <p style={{ fontSize: "18px", color: "#666666" }}>
                    Payment confirmed
                  </p>
                </div>

                <div
                  style={{
                    background: "#D1FAE5",
                    border: "3px solid #10B981",
                    borderRadius: "12px",
                    padding: "24px",
                    marginBottom: "24px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "28px",
                      fontWeight: 900,
                      marginBottom: "16px",
                    }}
                  >
                    {currentScan.buyer_name}
                  </div>
                  <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                    📧 {currentScan.buyer_email}
                  </div>
                  <div style={{ fontSize: "16px", marginBottom: "8px" }}>
                    🎟️ {currentScan.quantity}{" "}
                    {currentScan.quantity === 1 ? "ticket" : "tickets"}
                  </div>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 800,
                      color: "#10B981",
                    }}
                  >
                    💰 $
                    {(currentScan.ticket_price * currentScan.quantity).toFixed(
                      2
                    )}{" "}
                    • Verified
                  </div>
                </div>

                <button
                  onClick={handleCheckIn}
                  style={{
                    width: "100%",
                    background: "#10B981",
                    color: "#FFFFFF",
                    border: "4px solid #000000",
                    borderRadius: "16px",
                    padding: "24px",
                    fontSize: "24px",
                    fontWeight: 900,
                    cursor: "pointer",
                    boxShadow: "8px 8px 0px #000000",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                    marginBottom: "12px",
                  }}
                >
                  ✓ CHECK IN & ADMIT
                </button>

                <button
                  onClick={handleScanAnother}
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QRScanner;

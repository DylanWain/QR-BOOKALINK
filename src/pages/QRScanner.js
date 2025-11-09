import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';

const QRScanner = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(true);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [error, setError] = useState(null);
  const scannerRef = useRef(null);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Wait for DOM to be ready
    const initScanner = () => {
      const element = document.getElementById('qr-reader');
      if (!element) {
        console.error('QR reader element not found');
        return;
      }

      try {
        const html5QrcodeScanner = new Html5QrcodeScanner(
          "qr-reader",
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        html5QrcodeScanner.render(onScanSuccess, onScanError);
        scannerRef.current = html5QrcodeScanner;
      } catch (err) {
        console.error('Failed to initialize scanner:', err);
      }
    };

    // Delay initialization slightly to ensure DOM is ready
    const timer = setTimeout(initScanner, 100);

    // Cleanup
    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear scanner:", error);
        });
      }
    };
  }, []);

  const onScanSuccess = async (decodedText) => {
    console.log('QR Code scanned:', decodedText);
    setScanning(false);

    // Stop scanner
    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => console.error('Clear error:', err));
    }

    // Look up ticket
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          events:event_id (
            event_name,
            ticket_price
          )
        `)
        .eq('ticket_code', decodedText)
        .single();

      if (ticketError || !ticket) {
        setError('Invalid ticket code');
        return;
      }

      if (ticket.checked_in) {
        setError('This ticket has already been checked in!');
        setTicketInfo(ticket);
        return;
      }

      // Check in the ticket
      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString()
        })
        .eq('ticket_code', decodedText);

      if (updateError) {
        console.error('Error checking in ticket:', updateError);
        setError('Failed to check in ticket');
        return;
      }

      // Success!
      setTicketInfo({ ...ticket, checked_in: true });

    } catch (err) {
      console.error('Scan error:', err);
      setError('Failed to verify ticket');
    }
  };

  const onScanError = (errorMessage) => {
    // Ignore scanning errors (they happen constantly)
  };

  const resetScanner = () => {
    window.location.reload();
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', padding: '20px' }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        paddingTop: '40px'
      }}>
        
        {/* Header */}
        <div style={{
          background: '#FFFFFF',
          border: '4px solid #000000',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '8px 8px 0px #000000',
          marginBottom: '24px',
          textAlign: 'center'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 900,
            marginBottom: '8px'
          }}>
            📱 QR Scanner
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#666',
            margin: 0
          }}>
            Scan ticket QR codes to check in guests
          </p>
        </div>

        {/* Scanner */}
        {scanning && !ticketInfo && !error && (
          <div style={{
            background: '#FFFFFF',
            border: '4px solid #000000',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '8px 8px 0px #000000'
          }}>
            <div id="qr-reader" style={{ width: '100%' }}></div>
          </div>
        )}

        {/* Success Result */}
        {ticketInfo && !error && (
          <div style={{
            background: '#FFFFFF',
            border: '4px solid #000000',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '8px 8px 0px #000000',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 900,
              color: '#10B981',
              marginBottom: '24px'
            }}>
              Check-In Successful!
            </h2>

            <div style={{
              background: '#F9FAFB',
              border: '2px solid #E5E7EB',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px',
              textAlign: 'left'
            }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Event:</span>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  {ticketInfo.events?.event_name || 'Event'}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Guest:</span>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  {ticketInfo.buyer_name}
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Ticket Code:</span>
                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace' }}>
                  {ticketInfo.ticket_code}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '14px', color: '#666' }}>Quantity:</span>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>
                  {ticketInfo.quantity} ticket{ticketInfo.quantity !== 1 ? 's' : ''}
                </div>
              </div>
            </div>

            <button
              onClick={resetScanner}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#FFFFFF',
                border: '3px solid #000000',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '18px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '6px 6px 0px #000000',
                textTransform: 'uppercase'
              }}
            >
              Scan Next Ticket
            </button>
          </div>
        )}

        {/* Error Result */}
        {error && (
          <div style={{
            background: '#FFFFFF',
            border: '4px solid #000000',
            borderRadius: '20px',
            padding: '32px',
            boxShadow: '8px 8px 0px #000000',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
            <h2 style={{
              fontSize: '28px',
              fontWeight: 900,
              color: '#EF4444',
              marginBottom: '16px'
            }}>
              {ticketInfo?.checked_in ? 'Already Checked In' : 'Invalid Ticket'}
            </h2>

            <p style={{
              fontSize: '16px',
              color: '#666',
              marginBottom: '24px'
            }}>
              {error}
            </p>

            {ticketInfo && (
              <div style={{
                background: '#FEE2E2',
                border: '2px solid #EF4444',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '24px',
                textAlign: 'left'
              }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>Guest:</span>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>
                    {ticketInfo.buyer_name}
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '14px', color: '#666' }}>Checked in at:</span>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>
                    {new Date(ticketInfo.checked_in_at).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={resetScanner}
              style={{
                width: '100%',
                background: '#FFFFFF',
                color: '#000000',
                border: '3px solid #000000',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '18px',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '6px 6px 0px #000000',
                textTransform: 'uppercase'
              }}
            >
              Scan Another Ticket
            </button>
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate('/my-events')}
          style={{
            width: '100%',
            marginTop: '24px',
            background: 'transparent',
            color: '#666',
            border: '3px solid #E5E7EB',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ← Back to Events
        </button>
      </div>
    </div>
  );
};

export default QRScanner;

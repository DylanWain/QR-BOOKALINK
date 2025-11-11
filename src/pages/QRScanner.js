import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';

const QRScanner = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  
  const [scanning, setScanning] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [eventInfo, setEventInfo] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  
  const html5QrCodeRef = useRef(null);
  const isInitializingRef = useRef(false);

  useEffect(() => {
    if (eventId) {
      loadEventInfo();
    }
    
    // Wait for library to load, then start camera
    const checkLibraryAndStart = () => {
      if (typeof window.Html5Qrcode !== 'undefined') {
        startCamera();
      } else {
        // Library not loaded yet, try again in 100ms
        setTimeout(checkLibraryAndStart, 100);
      }
    };
    
    checkLibraryAndStart();
    
    return () => {
      stopCamera();
    };
  }, [eventId]);

  const loadEventInfo = async () => {
    try {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('event_name, event_date, venue')
        .eq('event_id', eventId)
        .single();

      if (!eventError && event) {
        setEventInfo(event);
      }
    } catch (err) {
      console.error('Error loading event:', err);
    }
  };

  const startCamera = async () => {
    // Prevent multiple initialization attempts
    if (isInitializingRef.current) {
      return;
    }
    
    isInitializingRef.current = true;

    try {
      if (typeof window.Html5Qrcode === 'undefined') {
        console.error('Html5Qrcode library not loaded');
        setCameraError(true);
        isInitializingRef.current = false;
        return;
      }

      const Html5Qrcode = window.Html5Qrcode;
      html5QrCodeRef.current = new Html5Qrcode("qr-reader");

      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCodeRef.current.start(
        { facingMode: "environment" },
        config,
        onScanSuccess,
        onScanError
      );

      setScanning(true);
      setCameraReady(true);
      isInitializingRef.current = false;
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(true);
      isInitializingRef.current = false;
      
      // If main camera fails, try front camera
      if (err.name === 'NotFoundError' || err.name === 'OverconstrainedError') {
        tryFrontCamera();
      }
    }
  };

  const tryFrontCamera = async () => {
    try {
      if (!html5QrCodeRef.current) return;
      
      const config = { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };

      await html5QrCodeRef.current.start(
        { facingMode: "user" }, // front camera
        config,
        onScanSuccess,
        onScanError
      );

      setScanning(true);
      setCameraReady(true);
    } catch (err) {
      console.error('Front camera also failed:', err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    try {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop()
          .then(() => {
            html5QrCodeRef.current.clear();
          })
          .catch(err => {
            console.error('Error stopping camera:', err);
          });
      }
    } catch (err) {
      console.error('Stop camera error:', err);
    }
  };

  const onScanSuccess = async (decodedText, decodedResult) => {
    console.log('QR Code scanned:', decodedText);
    
    // Stop scanning immediately
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      await html5QrCodeRef.current.stop();
      setScanning(false);
    }
    
    // Verify the ticket
    await verifyTicket(decodedText);
  };

  const onScanError = (errorMessage) => {
    // Ignore scan errors (happens continuously while scanning)
    // console.log('Scan error:', errorMessage);
  };

  const verifyTicket = async (ticketCode) => {
    try {
      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          events:event_id (
            event_name,
            event_date,
            venue,
            ticket_price
          )
        `)
        .eq('ticket_code', ticketCode.trim().toUpperCase())
        .single();

      if (ticketError || !ticket) {
        setError('Invalid ticket code');
        return;
      }

      // Check if ticket matches the event (if eventId provided)
      if (eventId && ticket.event_id !== eventId) {
        setError('This ticket is for a different event!');
        setTicketInfo(ticket);
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
        .eq('ticket_code', ticketCode.trim().toUpperCase());

      if (updateError) {
        setError('Failed to check in ticket');
        return;
      }

      setTicketInfo({ ...ticket, checked_in: true });
    } catch (err) {
      console.error('Verify error:', err);
      setError('Failed to verify ticket');
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      verifyTicket(manualCode.trim().toUpperCase());
    }
  };

  const resetScanner = () => {
    setTicketInfo(null);
    setError(null);
    setManualCode('');
    setCameraError(false);
    setCameraReady(false);
    isInitializingRef.current = false;
    
    // Restart camera
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', padding: '20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto', paddingTop: '40px' }}>
        
        {/* Header with Event Info */}
        <div style={{ background: '#FFFFFF', border: '4px solid #000000', borderRadius: '20px', padding: '24px', boxShadow: '8px 8px 0px #000000', marginBottom: '24px', textAlign: 'center' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 900, marginBottom: '8px' }}>📱 QR Scanner</h1>
          {eventInfo ? (
            <div>
              <p style={{ fontSize: '18px', fontWeight: 700, color: '#667eea', margin: '8px 0' }}>{eventInfo.event_name}</p>
              <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                {new Date(eventInfo.event_date).toLocaleDateString()} • {eventInfo.venue}
              </p>
            </div>
          ) : (
            <p style={{ fontSize: '16px', color: '#666', margin: 0 }}>Scan or enter ticket codes to check in guests</p>
          )}
        </div>

        {/* Scanner and Manual Entry */}
        {!ticketInfo && !error && (
          <>
            {/* Camera Scanner */}
            {!cameraError && (
              <div style={{ background: '#FFFFFF', border: '4px solid #000000', borderRadius: '20px', padding: '24px', boxShadow: '8px 8px 0px #000000', marginBottom: '24px' }}>
                <div id="qr-reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
                {!cameraReady && (
                  <div style={{ textAlign: 'center', marginTop: '16px' }}>
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                    <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
                      Initializing camera...
                    </p>
                  </div>
                )}
                {cameraReady && (
                  <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#10B981', fontWeight: 600 }}>
                    ✓ Camera ready - Point at QR code
                  </p>
                )}
              </div>
            )}

            {/* Camera Error Message */}
            {cameraError && (
              <div style={{ background: '#FEF2F2', border: '3px solid #EF4444', borderRadius: '20px', padding: '20px', marginBottom: '24px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                <p style={{ fontSize: '14px', color: '#EF4444', fontWeight: 600, marginBottom: '8px' }}>
                  Camera not available
                </p>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>
                  Please use manual entry below or check camera permissions
                </p>
              </div>
            )}

            {/* Manual Entry */}
            <div style={{ background: '#FFFFFF', border: '4px solid #000000', borderRadius: '20px', padding: '24px', boxShadow: '8px 8px 0px #000000' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '16px', textAlign: 'center' }}>
                {cameraError ? '📝 Enter Ticket Code' : 'Or Enter Manually'}
              </h3>
              <form onSubmit={handleManualSubmit}>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="TIX-XXXXXXX"
                  style={{
                    width: '100%',
                    padding: '14px',
                    border: '3px solid #000000',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                    boxSizing: 'border-box',
                    textAlign: 'center',
                    letterSpacing: '1px'
                  }}
                  autoComplete="off"
                  autoCapitalize="characters"
                />
                <button
                  type="submit"
                  disabled={!manualCode.trim()}
                  style={{
                    width: '100%',
                    background: manualCode.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#E5E7EB',
                    color: manualCode.trim() ? '#FFFFFF' : '#9CA3AF',
                    border: '3px solid #000000',
                    borderRadius: '12px',
                    padding: '16px',
                    fontSize: '18px',
                    fontWeight: 900,
                    cursor: manualCode.trim() ? 'pointer' : 'not-allowed',
                    boxShadow: '6px 6px 0px #000000',
                    transition: 'all 0.2s'
                  }}
                >
                  ✓ Verify Ticket
                </button>
              </form>
            </div>
          </>
        )}

        {/* Success State */}
        {ticketInfo && !error && (
          <div style={{ background: '#FFFFFF', border: '4px solid #000000', borderRadius: '20px', padding: '32px', boxShadow: '8px 8px 0px #000000', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#10B981', marginBottom: '24px' }}>Check-In Successful!</h2>
            <div style={{ background: '#F9FAFB', border: '2px solid #E5E7EB', borderRadius: '12px', padding: '20px', marginBottom: '24px', textAlign: 'left' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Event:</span>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{ticketInfo.events?.event_name || 'Event'}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Guest:</span>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{ticketInfo.buyer_name}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Email:</span>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{ticketInfo.buyer_email}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', color: '#666' }}>Ticket Code:</span>
                <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'monospace' }}>{ticketInfo.ticket_code}</div>
              </div>
              <div>
                <span style={{ fontSize: '14px', color: '#666' }}>Quantity:</span>
                <div style={{ fontSize: '18px', fontWeight: 700 }}>{ticketInfo.quantity} ticket{ticketInfo.quantity !== 1 ? 's' : ''}</div>
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
                boxShadow: '6px 6px 0px #000000' 
              }}
            >
              📱 Scan Next Ticket
            </button>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div style={{ background: '#FFFFFF', border: '4px solid #000000', borderRadius: '20px', padding: '32px', boxShadow: '8px 8px 0px #000000', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#EF4444', marginBottom: '16px' }}>
              {ticketInfo?.checked_in ? 'Already Checked In' : 
               eventId && ticketInfo?.event_id !== eventId ? 'Wrong Event' : 
               'Invalid Ticket'}
            </h2>
            <p style={{ fontSize: '16px', color: '#666', marginBottom: '24px' }}>{error}</p>
            {ticketInfo && (
              <div style={{ background: '#FEE2E2', border: '2px solid #EF4444', borderRadius: '12px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>Event:</span>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{ticketInfo.events?.event_name || 'Unknown'}</div>
                </div>
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#666' }}>Guest:</span>
                  <div style={{ fontSize: '16px', fontWeight: 700 }}>{ticketInfo.buyer_name}</div>
                </div>
                {ticketInfo.checked_in && ticketInfo.checked_in_at && (
                  <div>
                    <span style={{ fontSize: '14px', color: '#666' }}>Checked in at:</span>
                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{new Date(ticketInfo.checked_in_at).toLocaleString()}</div>
                  </div>
                )}
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
                boxShadow: '6px 6px 0px #000000' 
              }}
            >
              🔄 Try Again
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

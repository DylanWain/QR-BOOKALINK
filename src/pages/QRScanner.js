import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';

const QRScanner = () => {
  const navigate = useNavigate();
  const { eventId } = useParams(); // ← NOW READS EVENT ID FROM URL
  
  const [scanning, setScanning] = useState(false);
  const [ticketInfo, setTicketInfo] = useState(null);
  const [error, setError] = useState(null);
  const [manualCode, setManualCode] = useState('');
  const [cameraError, setCameraError] = useState(false);
  const [eventInfo, setEventInfo] = useState(null); // ← NEW: Store event info

  useEffect(() => {
    // Load event info if eventId provided
    if (eventId) {
      loadEventInfo();
    }
    startCamera();
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
    try {
      if (typeof window.Html5Qrcode === 'undefined') {
        setCameraError(true);
        return;
      }

      const Html5Qrcode = window.Html5Qrcode;
      const html5QrCode = new Html5Qrcode("qr-reader");

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        onScanSuccess,
        () => {}
      );

      setScanning(true);
    } catch (err) {
      console.error('Camera error:', err);
      setCameraError(true);
    }
  };

  const stopCamera = () => {
    try {
      if (typeof window.Html5Qrcode !== 'undefined') {
        const Html5Qrcode = window.Html5Qrcode;
        const html5QrCode = new Html5Qrcode("qr-reader");
        if (html5QrCode.isScanning) {
          html5QrCode.stop();
        }
      }
    } catch (err) {
      console.error('Stop camera error:', err);
    }
  };

  const onScanSuccess = async (decodedText) => {
    await verifyTicket(decodedText);
  };

  const verifyTicket = async (ticketCode) => {
    try {
      stopCamera();
      setScanning(false);

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
        .eq('ticket_code', ticketCode)
        .single();

      if (ticketError || !ticket) {
        setError('Invalid ticket code');
        return;
      }

      // ← NEW: Check if ticket matches the event (if eventId provided)
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

      const { error: updateError } = await supabase
        .from('tickets')
        .update({
          checked_in: true,
          checked_in_at: new Date().toISOString()
        })
        .eq('ticket_code', ticketCode);

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
    window.location.reload();
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

        {!ticketInfo && !error && (
          <>
            {!cameraError && (
              <div style={{ background: '#FFFFFF', border: '4px solid #000000', borderRadius: '20px', padding: '24px', boxShadow: '8px 8px 0px #000000', marginBottom: '24px' }}>
                <div id="qr-reader" style={{ width: '100%' }}></div>
                {!scanning && (
                  <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '14px', color: '#666' }}>
                    Initializing camera...
                  </p>
                )}
              </div>
            )}

            <div style={{ background: '#FFFFFF', border: '4px solid #000000', borderRadius: '20px', padding: '24px', boxShadow: '8px 8px 0px #000000' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 900, marginBottom: '16px', textAlign: 'center' }}>
                Or Enter Manually
              </h3>
              <form onSubmit={handleManualSubmit}>
                <input
                  type="text"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  placeholder="TIX-XXXXXXX"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '3px solid #000000',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: 600,
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    marginBottom: '12px',
                    boxSizing: 'border-box'
                  }}
                />
                <button
                  type="submit"
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
                  ✓ Verify Ticket
                </button>
              </form>
            </div>
          </>
        )}

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
            <button onClick={resetScanner} style={{ width: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#FFFFFF', border: '3px solid #000000', borderRadius: '12px', padding: '16px', fontSize: '18px', fontWeight: 900, cursor: 'pointer', boxShadow: '6px 6px 0px #000000' }}>
              📱 Scan Next Ticket
            </button>
          </div>
        )}

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
            <button onClick={resetScanner} style={{ width: '100%', background: '#FFFFFF', color: '#000000', border: '3px solid #000000', borderRadius: '12px', padding: '16px', fontSize: '18px', fontWeight: 900, cursor: 'pointer', boxShadow: '6px 6px 0px #000000' }}>
              🔄 Try Again
            </button>
          </div>
        )}

        <button onClick={() => navigate('/my-events')} style={{ width: '100%', marginTop: '24px', background: 'transparent', color: '#666', border: '3px solid #E5E7EB', borderRadius: '12px', padding: '16px', fontSize: '16px', fontWeight: 700, cursor: 'pointer' }}>
          ← Back to Events
        </button>
      </div>
    </div>
  );
};

export default QRScanner;

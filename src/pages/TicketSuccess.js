import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../config/supabase';
import QRCode from 'qrcode';

const TicketSuccess = () => {
  const { ticketCode } = useParams();
  const [ticket, setTicket] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketCode]);

  const loadTicket = async () => {
    try {
      // Get ticket with event details
      const { data: ticketData, error: ticketError } = await supabase
        .from('tickets')
        .select(`
          *,
          events:event_id (
            event_name,
            ticket_price
          )
        `)
        .eq('ticket_code', ticketCode)
        .single();

      if (ticketError) {
        console.error('Error loading ticket:', ticketError);
        alert('Ticket not found');
        return;
      }

      setTicket(ticketData);

      // Generate QR code
      const qrUrl = await QRCode.toDataURL(ticketCode, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      setQrCodeUrl(qrUrl);

      // Update ticket with QR code URL
      await supabase
        .from('tickets')
        .update({ qr_code_url: qrUrl })
        .eq('ticket_code', ticketCode);

    } catch (error) {
      console.error('Error loading ticket:', error);
      alert('Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `ticket-${ticketCode}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  const shareTicket = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Ticket for ${ticket?.events?.event_name || 'Event'}`,
          text: `Your ticket code: ${ticketCode}`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      alert('Sharing not supported on this device');
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F3F4F6'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <div style={{ fontSize: '18px', fontWeight: 600 }}>Loading your ticket...</div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#F3F4F6'
      }}>
        <div style={{
          background: '#FFFFFF',
          border: '4px solid #000000',
          borderRadius: '20px',
          padding: '40px',
          boxShadow: '8px 8px 0px #000000',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>😕</div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '12px' }}>
            Ticket Not Found
          </h2>
          <p style={{ fontSize: '16px', color: '#666' }}>
            This ticket doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6', padding: '20px' }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        paddingTop: 'clamp(20px, 5vw, 40px)'
      }}>
        {/* Success Message */}
        <div style={{
          background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          border: '4px solid #000000',
          borderRadius: '20px',
          padding: 'clamp(24px, 6vw, 32px)',
          boxShadow: '8px 8px 0px #000000',
          marginBottom: '24px',
          textAlign: 'center',
          color: '#FFFFFF'
        }}>
          <div style={{ fontSize: 'clamp(60px, 15vw, 80px)', marginBottom: '16px' }}>🎉</div>
          <h1 style={{
            fontSize: 'clamp(24px, 6vw, 32px)',
            fontWeight: 900,
            marginBottom: '12px',
            textShadow: '3px 3px 0px rgba(0,0,0,0.3)'
          }}>
            Payment Successful!
          </h1>
          <p style={{
            fontSize: 'clamp(16px, 4vw, 18px)',
            opacity: 0.9
          }}>
            Your ticket has been confirmed
          </p>
        </div>

        {/* Ticket Card */}
        <div style={{
          background: '#FFFFFF',
          border: '4px solid #000000',
          borderRadius: '20px',
          padding: 'clamp(24px, 6vw, 32px)',
          boxShadow: '8px 8px 0px #000000',
          marginBottom: '24px'
        }}>
          {/* Event Name */}
          <h2 style={{
            fontSize: 'clamp(20px, 5vw, 24px)',
            fontWeight: 900,
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {ticket.events?.event_name || 'Event Ticket'}
          </h2>

          {/* QR Code */}
          {qrCodeUrl && (
            <div style={{
              background: '#FFFFFF',
              border: '3px solid #000000',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <img
                src={qrCodeUrl}
                alt="Ticket QR Code"
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  height: 'auto',
                  borderRadius: '8px'
                }}
              />
              <div style={{
                marginTop: '16px',
                fontSize: '14px',
                fontWeight: 700,
                color: '#666'
              }}>
                📱 Show this QR code at the event
              </div>
            </div>
          )}

          {/* Ticket Details */}
          <div style={{
            background: '#F9FAFB',
            border: '2px solid #E5E7EB',
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '2px solid #E5E7EB'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Ticket Code</span>
              <span style={{
                fontSize: '14px',
                fontWeight: 800,
                fontFamily: 'monospace',
                color: '#000000'
              }}>
                {ticketCode}
              </span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '2px solid #E5E7EB'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Name</span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{ticket.buyer_name}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '2px solid #E5E7EB'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Email</span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{ticket.buyer_email}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '12px',
              paddingBottom: '12px',
              borderBottom: '2px solid #E5E7EB'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Quantity</span>
              <span style={{ fontSize: '14px', fontWeight: 700 }}>{ticket.quantity} ticket{ticket.quantity !== 1 ? 's' : ''}</span>
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <span style={{ fontSize: '14px', color: '#666' }}>Total Paid</span>
              <span style={{ fontSize: '18px', fontWeight: 900, color: '#10B981' }}>
                ${parseFloat(ticket.total_paid).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
            <button
              onClick={downloadQRCode}
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#FFFFFF',
                border: '3px solid #000000',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '4px 4px 0px #000000'
              }}
            >
              📥 Download QR
            </button>

            <button
              onClick={shareTicket}
              style={{
                flex: 1,
                background: '#FFFFFF',
                color: '#000000',
                border: '3px solid #000000',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '16px',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '4px 4px 0px #000000'
              }}
            >
              📤 Share
            </button>
          </div>

          {/* Important Notice */}
          <div style={{
            background: '#FFF9DB',
            border: '2px solid #F59E0B',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '14px',
            fontWeight: 600,
            color: '#92400E'
          }}>
            ⚠️ <strong>Important:</strong> Take a screenshot or download this QR code. You'll need to show it at the event entrance.
          </div>
        </div>

        {/* Email Notice */}
        <div style={{
          background: '#FFFFFF',
          border: '3px solid #000000',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '6px 6px 0px #000000',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📧</div>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            A confirmation email has been sent to <strong>{ticket.buyer_email}</strong>
          </p>
        </div>
      </div>
    </div>
  );
};

export default TicketSuccess;

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);

const CheckoutForm = ({ eventData, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    quantity: 1
  });

  const calculateTotal = () => {
    const subtotal = eventData.ticket_price * formData.quantity;
    const fee = 1 * formData.quantity; // $1 per ticket service fee
    return {
      subtotal: subtotal.toFixed(2),
      fee: fee.toFixed(2),
      total: (subtotal + fee).toFixed(2)
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!formData.name || !formData.email) {
      setError('Please fill in all fields');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const totals = calculateTotal();

      // Create payment intent
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: Math.round(parseFloat(totals.total) * 100),
          eventId: eventData.id,
          quantity: formData.quantity
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create payment intent');
      }

      const { clientSecret } = await response.json();

      // Confirm payment
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: formData.name,
            email: formData.email,
          },
        },
      });

      if (stripeError) {
        setError(stripeError.message);
        setProcessing(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Generate ticket code
        const ticketCode = 'TIX-' + Math.random().toString(36).substr(2, 9).toUpperCase();

        // Create ticket in database
        const { data: ticketData, error: ticketError } = await supabase
          .from('tickets')
          .insert([
            {
              event_id: eventData.id,
              ticket_code: ticketCode,
              buyer_name: formData.name,
              buyer_email: formData.email,
              quantity: formData.quantity,
              ticket_price: parseFloat(eventData.ticket_price),
              total_paid: parseFloat(totals.total),
              payment_method: 'stripe',
              payment_status: 'completed',
              payment_id: paymentIntent.id,
              stripe_payment_id: paymentIntent.id,
              status: 'completed',
              checked_in: false
            },
          ])
          .select()
          .single();

        if (ticketError) {
          console.error('Error creating ticket:', ticketError);
          setError('Payment succeeded but failed to create ticket. Please contact support with payment ID: ' + paymentIntent.id);
          setProcessing(false);
          return;
        }

        // Send confirmation email with QR code
        try {
          const emailResponse = await fetch('/api/send-ticket-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ticketCode: ticketCode,
              buyerName: formData.name,
              buyerEmail: formData.email,
              eventName: eventData.event_name,
              quantity: formData.quantity,
              ticketPrice: eventData.ticket_price,
              totalPaid: totals.total
            }),
          });

          const emailResult = await emailResponse.json();
          if (emailResult.success) {
            console.log('✅ Email sent successfully');
          }
        } catch (emailError) {
          console.error('❌ Email error:', emailError);
        }

        // Success
        onSuccess(ticketCode);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message || 'Payment failed. Please try again.');
      setProcessing(false);
    }
  };

  const totals = calculateTotal();

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%' }}>
      {/* Name Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 700,
          marginBottom: '8px'
        }}>
          Full Name
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="John Doe"
          required
          style={{
            width: '100%',
            padding: '12px',
            border: '3px solid #000000',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Email Input */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 700,
          marginBottom: '8px'
        }}>
          Email Address
        </label>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="john@example.com"
          required
          style={{
            width: '100%',
            padding: '12px',
            border: '3px solid #000000',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Quantity Selector */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 700,
          marginBottom: '8px'
        }}>
          Number of Tickets
        </label>
        <select
          value={formData.quantity}
          onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
          style={{
            width: '100%',
            padding: '12px',
            border: '3px solid #000000',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            boxSizing: 'border-box'
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
            <option key={num} value={num}>{num}</option>
          ))}
        </select>
      </div>

      {/* Card Element */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{
          display: 'block',
          fontSize: '14px',
          fontWeight: 700,
          marginBottom: '8px'
        }}>
          Card Information
        </label>
        <div style={{
          padding: '14px',
          border: '3px solid #000000',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF'
        }}>
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#000000',
                  '::placeholder': {
                    color: '#999999',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Price Breakdown */}
      <div style={{
        background: '#F9FAFB',
        border: '2px solid #E5E7EB',
        borderRadius: '12px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '8px',
          fontSize: '14px'
        }}>
          <span>Tickets ({formData.quantity} × ${eventData.ticket_price})</span>
          <span style={{ fontWeight: 700 }}>${totals.subtotal}</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '2px solid #E5E7EB',
          fontSize: '14px',
          color: '#666'
        }}>
          <span>Service Fee</span>
          <span style={{ fontWeight: 700 }}>${totals.fee}</span>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '18px',
          fontWeight: 900
        }}>
          <span>Total</span>
          <span style={{ color: '#10B981' }}>${totals.total}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div style={{
          background: '#FEE2E2',
          border: '2px solid #EF4444',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '16px',
          color: '#DC2626',
          fontSize: '14px',
          fontWeight: 600
        }}>
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          width: '100%',
          background: processing ? '#9CA3AF' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#FFFFFF',
          border: '3px solid #000000',
          borderRadius: '12px',
          padding: '16px',
          fontSize: '18px',
          fontWeight: 900,
          cursor: processing ? 'not-allowed' : 'pointer',
          boxShadow: processing ? 'none' : '6px 6px 0px #000000',
          textTransform: 'uppercase'
        }}
      >
        {processing ? '⏳ Processing...' : `💳 Pay $${totals.total}`}
      </button>

      <div style={{
        textAlign: 'center',
        marginTop: '16px',
        fontSize: '12px',
        color: '#666'
      }}>
        🔒 Secure payment powered by Stripe
      </div>
    </form>
  );
};

const PaymentPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) {
        console.error('Error loading event:', error);
        alert('Event not found');
        return;
      }

      setEventData(data);
    } catch (error) {
      console.error('Error loading event:', error);
      alert('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (ticketCode) => {
    navigate(`/ticket/${ticketCode}`);
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
          <div style={{ fontSize: '18px', fontWeight: 600 }}>Loading event...</div>
        </div>
      </div>
    );
  }

  if (!eventData) {
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
            Event Not Found
          </h2>
          <p style={{ fontSize: '16px', color: '#666' }}>
            This event doesn't exist or has been removed.
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
        {/* Trust Badges */}
        <div style={{
          background: '#FFFFFF',
          border: '3px solid #000000',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px',
          boxShadow: '4px 4px 0px #000000'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 700,
            color: '#666',
            marginBottom: '12px',
            textAlign: 'center',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Trusted by thousands of event organizers
          </div>
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '16px',
            fontSize: '13px',
            fontWeight: 600,
            color: '#999'
          }}>
            <span>🎉 Partiful</span>
            <span>•</span>
            <span>🎫 Eventbrite</span>
            <span>•</span>
            <span>📅 Lu.ma</span>
            <span>•</span>
            <span>🎪 Dice</span>
            <span>•</span>
            <span>🎭 Universe</span>
          </div>
          <div style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '2px solid #F3F4F6',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '20px',
            fontSize: '12px',
            color: '#666',
            fontWeight: 600
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔒</span>
              <span>SSL Encrypted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>✅</span>
              <span>PCI Compliant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>💳</span>
              <span>Stripe Verified</span>
            </div>
          </div>
        </div>

        {/* Event Info Card */}
        <div style={{
          background: '#FFFFFF',
          border: '4px solid #000000',
          borderRadius: '20px',
          padding: 'clamp(24px, 6vw, 32px)',
          boxShadow: '8px 8px 0px #000000',
          marginBottom: '24px'
        }}>
          <h1 style={{
            fontSize: 'clamp(24px, 6vw, 32px)',
            fontWeight: 900,
            marginBottom: '16px',
            wordBreak: 'break-word'
          }}>
            🎉 {eventData.event_name}
          </h1>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '12px',
            fontSize: 'clamp(18px, 4.5vw, 20px)',
            fontWeight: 800,
            color: '#667eea'
          }}>
            <span>💰</span>
            <span>${eventData.ticket_price} per ticket</span>
          </div>

          {!eventData.unlimited && (
            <div style={{
              fontSize: '14px',
              color: '#666',
              fontWeight: 600
            }}>
              📊 Limited tickets available
            </div>
          )}
        </div>

        {/* Payment Form Card */}
        <div style={{
          background: '#FFFFFF',
          border: '4px solid #000000',
          borderRadius: '20px',
          padding: 'clamp(24px, 6vw, 32px)',
          boxShadow: '8px 8px 0px #000000'
        }}>
          <h2 style={{
            fontSize: 'clamp(20px, 5vw, 24px)',
            fontWeight: 900,
            marginBottom: '24px'
          }}>
            💳 Purchase Tickets
          </h2>

          <Elements stripe={stripePromise}>
            <CheckoutForm eventData={eventData} onSuccess={handleSuccess} />
          </Elements>
        </div>

        {/* Additional Trust Indicators */}
        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '13px',
          color: '#999',
          fontWeight: 600
        }}>
          <div style={{ marginBottom: '8px' }}>
            ⚡ Instant ticket delivery via email
          </div>
          <div style={{ marginBottom: '8px' }}>
            🎟️ QR code for easy check-in
          </div>
          <div>
            💯 100% money-back guarantee
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;

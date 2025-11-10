import React from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#F3F4F6' }}>
      {/* Hero Section */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 'clamp(40px, 10vw, 80px) clamp(20px, 5vw, 40px)',
        borderBottom: '4px solid #000000'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 'clamp(48px, 12vw, 64px)', marginBottom: '20px' }}>🎟️</div>
          <h1 style={{
            fontSize: 'clamp(36px, 8vw, 56px)',
            fontWeight: 900,
            color: '#FFFFFF',
            textShadow: '4px 4px 0px rgba(0,0,0,0.3)',
            marginBottom: '20px',
            lineHeight: 1.2
          }}>
            BookaLink Events
          </h1>
          <p style={{
            fontSize: 'clamp(18px, 4vw, 24px)',
            color: '#FFFFFF',
            opacity: 0.95,
            maxWidth: '800px',
            margin: '0 auto 40px auto',
            lineHeight: 1.6
          }}>
            Sell tickets for your Partiful events with ease. Create, share, and scan QR codes instantly.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => navigate('/signup')}
              style={{
                background: '#FFFFFF',
                color: '#667eea',
                border: '4px solid #000000',
                borderRadius: '16px',
                padding: 'clamp(16px, 4vw, 20px) clamp(32px, 8vw, 48px)',
                fontSize: 'clamp(18px, 4vw, 22px)',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '6px 6px 0px #000000',
                textTransform: 'uppercase'
              }}
            >
              🚀 Get Started Free
            </button>
            <button
              onClick={() => navigate('/login')}
              style={{
                background: 'transparent',
                color: '#FFFFFF',
                border: '4px solid #FFFFFF',
                borderRadius: '16px',
                padding: 'clamp(16px, 4vw, 20px) clamp(32px, 8vw, 48px)',
                fontSize: 'clamp(18px, 4vw, 22px)',
                fontWeight: 900,
                cursor: 'pointer',
                boxShadow: '6px 6px 0px rgba(0,0,0,0.3)'
              }}
            >
              Sign In
            </button>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: 'clamp(60px, 15vw, 100px) clamp(20px, 5vw, 40px)' }}>
        <h2 style={{ fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 900, textAlign: 'center', marginBottom: 'clamp(40px, 10vw, 60px)', color: '#000000' }}>
          How It Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(24px, 6vw, 40px)' }}>
          
          <div style={{ background: '#FFFFFF', border: '4px solid #000000', borderRadius: '20px', padding: 'clamp(32px, 8vw, 40px)', boxShadow: '8px 8px 0px #000000', textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(64px, 16vw, 80px)', marginBottom: '20px' }}>1️⃣</div>
            <h3 style={{ fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 900, marginBottom: '16px', color: '#667eea' }}>
              Create Your Event
            </h3>
            <p style={{ fontSize: 'clamp(16px, 4vw, 18px)', color: '#666', lineHeight: 1.6, marginBottom: '20px' }}>
              Set your ticket price, quantity, and event details. Get your unique payment link instantly.
            </p>
            <div style={{ background: '#F0F9FF', border: '2px solid #3B82F6', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700, color: '#1E40AF' }}>
              ⚡ Takes 30 seconds
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '4px solid #000000', borderRadius: '20px', padding: 'clamp(32px, 8vw, 40px)', boxShadow: '8px 8px 0px #000000', textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(64px, 16vw, 80px)', marginBottom: '20px' }}>2️⃣</div>
            <h3 style={{ fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 900, marginBottom: '16px', color: '#10B981' }}>
              Share on Partiful
            </h3>
            <p style={{ fontSize: 'clamp(16px, 4vw, 18px)', color: '#666', lineHeight: 1.6, marginBottom: '20px' }}>
              Copy your payment link and add it to your Partiful event. Guests purchase tickets directly.
            </p>
            <div style={{ background: '#D1FAE5', border: '2px solid #10B981', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700, color: '#065F46' }}>
              🔗 One-click copy
            </div>
          </div>

          <div style={{ background: '#FFFFFF', border: '4px solid #000000', borderRadius: '20px', padding: 'clamp(32px, 8vw, 40px)', boxShadow: '8px 8px 0px #000000', textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(64px, 16vw, 80px)', marginBottom: '20px' }}>3️⃣</div>
            <h3 style={{ fontSize: 'clamp(24px, 5vw, 28px)', fontWeight: 900, marginBottom: '16px', color: '#F59E0B' }}>
              Scan QR Codes
            </h3>
            <p style={{ fontSize: 'clamp(16px, 4vw, 18px)', color: '#666', lineHeight: 1.6, marginBottom: '20px' }}>
              At your event, use our built-in scanner to verify tickets. Guests show their QR code, you scan, done!
            </p>
            <div style={{ background: '#FFF9DB', border: '2px solid #F59E0B', borderRadius: '12px', padding: '12px', fontSize: '14px', fontWeight: 700, color: '#92400E' }}>
              📱 Works on any phone
            </div>
          </div>

        </div>
      </div>

      {/* Features Section */}
      <div style={{ background: '#FFFFFF', borderTop: '4px solid #000000', borderBottom: '4px solid #000000', padding: 'clamp(60px, 15vw, 80px) clamp(20px, 5vw, 40px)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 900, textAlign: 'center', marginBottom: 'clamp(40px, 10vw, 60px)', color: '#000000' }}>
            Why BookaLink?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'clamp(20px, 5vw, 32px)' }}>
            
            {[
              { emoji: '⚡', title: 'Instant Setup', desc: 'Create events in seconds, no approval needed' },
              { emoji: '💰', title: 'Get Paid Fast', desc: 'Direct deposits to your bank account' },
              { emoji: '📧', title: 'Auto Emails', desc: 'QR codes sent automatically to buyers' },
              { emoji: '📊', title: 'Live Dashboard', desc: 'Track sales and check-ins in real-time' },
              { emoji: '🔒', title: 'Secure', desc: 'Powered by Stripe for safe payments' },
              { emoji: '📱', title: 'Mobile First', desc: 'Works perfectly on all devices' }
            ].map((feature, index) => (
              <div key={index} style={{ background: '#F9FAFB', border: '3px solid #E5E7EB', borderRadius: '16px', padding: 'clamp(24px, 6vw, 32px)', textAlign: 'center' }}>
                <div style={{ fontSize: 'clamp(48px, 12vw, 56px)', marginBottom: '12px' }}>{feature.emoji}</div>
                <h4 style={{ fontSize: 'clamp(18px, 4vw, 20px)', fontWeight: 800, marginBottom: '8px', color: '#000000' }}>{feature.title}</h4>
                <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: '#666', lineHeight: 1.5, margin: 0 }}>{feature.desc}</p>
              </div>
            ))}

          </div>
        </div>
      </div>

      {/* Final CTA Section */}
      <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', padding: 'clamp(60px, 15vw, 100px) clamp(20px, 5vw, 40px)', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(32px, 7vw, 48px)', fontWeight: 900, color: '#FFFFFF', textShadow: '3px 3px 0px rgba(0,0,0,0.3)', marginBottom: '20px' }}>
            Ready to Get Started?
          </h2>
          <p style={{ fontSize: 'clamp(18px, 4vw, 22px)', color: '#FFFFFF', opacity: 0.95, marginBottom: '40px', lineHeight: 1.6 }}>
            Join hundreds of event organizers using BookaLink for their Partiful events.
          </p>
          <button
            onClick={() => navigate('/signup')}
            style={{
              background: '#FFFFFF',
              color: '#10B981',
              border: '4px solid #000000',
              borderRadius: '16px',
              padding: 'clamp(20px, 5vw, 24px) clamp(40px, 10vw, 60px)',
              fontSize: 'clamp(20px, 5vw, 24px)',
              fontWeight: 900,
              cursor: 'pointer',
              boxShadow: '8px 8px 0px #000000',
              textTransform: 'uppercase'
            }}
          >
            🎉 Create Your First Event
          </button>
          <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', color: '#FFFFFF', marginTop: '20px', opacity: 0.9 }}>
            No credit card required • Free to start
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1F2937', padding: 'clamp(40px, 10vw, 60px) clamp(20px, 5vw, 40px)', textAlign: 'center', color: '#FFFFFF' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 800, marginBottom: '12px' }}>BookaLink Events</p>
          <p style={{ fontSize: 'clamp(14px, 3.5vw, 16px)', opacity: 0.7, marginBottom: '20px' }}>
            The easiest way to sell tickets for your events
          </p>
          <div style={{ fontSize: 'clamp(12px, 3vw, 14px)', opacity: 0.5 }}>© 2025 BookaLink. All rights reserved.</div>
        </div>
      </div>
    </div>
  );
};

export default Home;

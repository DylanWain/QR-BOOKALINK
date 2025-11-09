import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { accountId } = req.body;

    console.log('Creating account link for:', accountId);

    if (!accountId) {
      return res.status(400).json({ error: 'Account ID required' });
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: 'https://qr-bookalink.vercel.app/create-event',
      return_url: 'https://qr-bookalink.vercel.app/create-event',
      type: 'account_onboarding',
    });

    console.log('✅ Account link created:', accountLink.url);

    res.status(200).json({
      url: accountLink.url
    });

  } catch (error) {
    console.error('❌ Account link error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create account link'
    });
  }
}

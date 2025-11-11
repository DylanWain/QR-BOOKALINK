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
    const { email, userId, accountId } = req.body;

    console.log('📥 Request body:', { email, userId, accountId });

    // If accountId is provided, just create the onboarding link
    if (accountId) {
      console.log('🔗 Creating account link for existing account:', accountId);
      
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: 'https://qr-bookalink.vercel.app/create-event',
        return_url: 'https://qr-bookalink.vercel.app/create-event',
        type: 'account_onboarding',
      });

      console.log('✅ Account link created:', accountLink.url);
      
      return res.status(200).json({
        accountId: accountId,
        url: accountLink.url
      });
    }

    // Otherwise, create NEW Stripe Connect account
    if (!email) {
      return res.status(400).json({ error: 'Email is required to create account' });
    }

    console.log('🆕 Creating NEW Stripe Connect account for:', email);

    // Create Stripe Express account
    const account = await stripe.accounts.create({
      type: 'express',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        user_id: userId || ''
      }
    });

    console.log('✅ Stripe account created:', account.id);

    // Create onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: 'https://qr-bookalink.vercel.app/create-event',
      return_url: 'https://qr-bookalink.vercel.app/create-event',
      type: 'account_onboarding',
    });

    console.log('✅ Account link created:', accountLink.url);

    res.status(200).json({
      accountId: account.id,
      url: accountLink.url
    });

  } catch (error) {
    console.error('❌ Stripe error:', error);
    res.status(500).json({
      error: error.message || 'Failed to create Stripe account'
    });
  }
}

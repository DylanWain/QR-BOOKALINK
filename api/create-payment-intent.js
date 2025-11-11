const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency = 'usd', stripeAccountId, applicationFee, eventId, quantity } = req.body;

    console.log('📝 Payment Intent Request:', { amount, currency, stripeAccountId, applicationFee, eventId, quantity });

    // Validate required fields
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    if (!stripeAccountId) {
      return res.status(400).json({ error: 'Stripe account ID is required' });
    }

    // Ensure amount is a valid number
    const amountInCents = typeof amount === 'number' ? amount : parseInt(amount);
    
    if (isNaN(amountInCents) || amountInCents <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Calculate application fee (your platform fee)
    const appFeeAmount = applicationFee || Math.round(amountInCents * 0.1); // 10% default or custom fee

    console.log('💰 Creating payment intent:', {
      amount: amountInCents,
      applicationFee: appFeeAmount,
      connectedAccount: stripeAccountId
    });

    // Create payment intent with Stripe Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: currency,
      application_fee_amount: appFeeAmount,
      transfer_data: {
        destination: stripeAccountId, // Host's connected account
      },
      metadata: {
        eventId: eventId?.toString() || 'unknown',
        quantity: quantity?.toString() || '1'
      }
    });

    console.log('✅ Payment intent created:', paymentIntent.id);

    res.status(200).json({
      clientSecret: paymentIntent.client_secret
    });
  } catch (error) {
    console.error('❌ Error creating payment intent:', error);
    res.status(500).json({ 
      error: error.message,
      type: error.type,
      code: error.code
    });
  }
}

// Create Stripe Connect Account
export const createConnectAccount = async (email, userId) => {
  try {
    console.log('🔵 Creating Stripe account for:', email);

    const response = await fetch('https://qr-bookalink.vercel.app/api/create-connect-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: email,
        userId: userId 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API error:', data);
      throw new Error(data.error || 'Failed to create Stripe account');
    }

    console.log('✅ API response:', data);

    return { 
      account: { id: data.accountId },
      link: { url: data.url },
      error: null 
    };
  } catch (error) {
    console.error('❌ Create connect account error:', error);
    return { 
      account: null, 
      link: null,
      error: error.message 
    };
  }
};

// Create Account Link
export const createAccountLink = async (accountId) => {
  try {
    console.log('🔵 Creating account link for:', accountId);

    const response = await fetch('https://qr-bookalink.vercel.app/api/create-connect-account', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountId }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API error:', data);
      throw new Error(data.error || 'Failed to create account link');
    }

    console.log('✅ API response:', data);

    return { link: { url: data.url }, error: null };
  } catch (error) {
    console.error('❌ Create account link error:', error);
    return { link: null, error: error.message };
  }
};

// Create Payment Intent
export const createPaymentIntent = async (amount, currency = 'usd', stripeAccountId) => {
  try {
    console.log('🔵 Creating payment intent:', { amount, currency, stripeAccountId });

    const response = await fetch('https://qr-bookalink.vercel.app/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        currency,
        stripeAccountId
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Payment intent error:', data);
      throw new Error(data.error || 'Failed to create payment intent');
    }

    console.log('✅ Payment intent created:', data.clientSecret);

    return {
      clientSecret: data.clientSecret,
      error: null
    };
  } catch (error) {
    console.error('❌ Create payment intent error:', error);
    return {
      clientSecret: null,
      error: error.message
    };
  }
};

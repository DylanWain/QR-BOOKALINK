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

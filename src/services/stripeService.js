const getApiBase = () => {
  // In production (Vercel), use relative /api path
  // In development, use full URL or localhost
  if (typeof window !== "undefined") {
    return window.location.hostname === "localhost"
      ? "http://localhost:3000/api"
      : "/api";
  }
  return "/api";
};

export const createConnectAccount = async (email) => {
  try {
    const response = await fetch(`${getApiBase()}/create-connect-account`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();

    if (data.error) {
      return { account: null, error: data.error };
    }

    return { account: data.account, error: null };
  } catch (error) {
    console.error("Create account error:", error);
    return { account: null, error: error.message };
  }
};

export const createAccountLink = async (accountId) => {
  try {
    const returnUrl = `${window.location.origin}/create-event?stripe_connected=true&account_id=${accountId}`;
    const refreshUrl = `${window.location.origin}/create-event?stripe_refresh=true`;

    const response = await fetch(`${getApiBase()}/create-account-link`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ accountId, returnUrl, refreshUrl }),
    });

    const data = await response.json();

    if (data.error) {
      return { link: null, error: data.error };
    }

    return { link: data.link, error: null };
  } catch (error) {
    console.error("Create link error:", error);
    return { link: null, error: error.message };
  }
};

export const createPaymentIntent = async (
  amount,
  connectedAccountId,
  applicationFee
) => {
  try {
    const response = await fetch(`${getApiBase()}/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, connectedAccountId, applicationFee }),
    });

    const data = await response.json();

    if (data.error) {
      return { intent: null, error: data.error };
    }

    return { intent: data.intent, error: null };
  } catch (error) {
    console.error("Create payment intent error:", error);
    return { intent: null, error: error.message };
  }
};

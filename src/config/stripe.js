import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe with your publishable key
export const stripePromise = loadStripe(
  process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY
);

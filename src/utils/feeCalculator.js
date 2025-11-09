export const calculateFees = (ticketPrice, quantity = 1) => {
  const subtotal = ticketPrice * quantity;

  // EventLink fee: $1 per ticket
  const eventLinkFee = 1.0 * quantity;

  // Total buyer pays
  const totalBuyerPays = subtotal + eventLinkFee;

  // PayPal fee (comes from host's portion)
  const paypalFee = subtotal * 0.0349 + 0.49;

  // Host receives
  const hostReceives = subtotal - paypalFee;

  return {
    ticketPrice,
    quantity,
    subtotal,
    eventLinkFee,
    paypalFee,
    totalBuyerPays,
    hostReceives,
    eventLinkRevenue: eventLinkFee,
  };
};

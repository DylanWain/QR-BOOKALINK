export const sendTicketEmail = async (ticketData) => {
  try {
    // This will work when deployed to Vercel with API route
    const response = await fetch("/api/send-ticket-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticketData),
    });

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Email error:", error);
    return { success: false, error };
  }
};

// For now, return success to allow testing
export const mockSendTicketEmail = async (ticketData) => {
  console.log("📧 Email would be sent:", ticketData);
  return { success: true, message: "Email will be sent when deployed" };
};

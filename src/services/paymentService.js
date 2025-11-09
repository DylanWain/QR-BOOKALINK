import { supabase } from "../config/supabase";
import { mockSendTicketEmail } from "./emailService";

export const handlePaymentSuccess = async (
  paymentDetails,
  eventId,
  buyerInfo,
  quantity
) => {
  try {
    // Generate unique ticket code
    const ticketCode = `TIX-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Get event details
    const { data: eventData, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventError) {
      console.error("Event fetch error:", eventError);
      return { success: false, error: "Event not found" };
    }

    // Calculate amounts
    const ticketPrice = parseFloat(eventData.ticket_price);
    const totalPaid = parseFloat(
      paymentDetails.purchase_units?.[0]?.amount?.value || 0
    );

    // Create ticket with buyer info
    const { data: ticketData, error: ticketError } = await supabase
      .from("tickets")
      .insert([
        {
          event_id: eventId,
          ticket_code: ticketCode,
          buyer_name: buyerInfo.name,
          buyer_email: buyerInfo.email,
          quantity: parseInt(quantity),
          ticket_price: ticketPrice,
          total_paid: totalPaid,
          payment_method: "stripe",
          payment_status: "completed",
          payment_id: paymentDetails.id,
          checked_in: false,
          email_sent: false,
        },
      ])
      .select()
      .single();

    if (ticketError) {
      console.error("Ticket creation error:", ticketError);
      return { success: false, error: "Failed to create ticket" };
    }

    // Generate QR code URL
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${ticketCode}`;

    // Send email with ticket
    await mockSendTicketEmail({
      to: buyerInfo.email,
      buyerName: buyerInfo.name,
      eventName: eventData.event_name,
      ticketCode: ticketCode,
      quantity: quantity,
      qrCodeUrl: qrCodeUrl,
      totalPaid: totalPaid,
    });

    // Update ticket to mark email as sent
    await supabase
      .from("tickets")
      .update({ email_sent: true })
      .eq("id", ticketData.id);

    return {
      success: true,
      ticketCode: ticketCode,
      qrCodeUrl: qrCodeUrl,
      ticketId: ticketData.id,
    };
  } catch (error) {
    console.error("Payment processing error:", error);
    return { success: false, error: error.message };
  }
};

import { supabase } from "../config/supabase";
import QRCode from "qrcode";

export const createTicket = async (ticketData) => {
  // Generate QR code
  const qrData = JSON.stringify({
    ticketCode: ticketData.ticket_code,
    eventId: ticketData.event_id,
    buyerName: ticketData.buyer_name,
    quantity: ticketData.quantity,
  });

  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 400,
    margin: 2,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });

  const { data, error } = await supabase
    .from("tickets")
    .insert([
      {
        ...ticketData,
        qr_code_url: qrCodeDataUrl,
      },
    ])
    .select()
    .single();

  return { data, error, qrCodeUrl: qrCodeDataUrl };
};

export const getEventTickets = async (eventId) => {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  return { data, error };
};

export const getTicketByCode = async (ticketCode) => {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("ticket_code", ticketCode)
    .single();

  return { data, error };
};

export const checkInTicket = async (ticketCode) => {
  const { data, error } = await supabase
    .from("tickets")
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
    })
    .eq("ticket_code", ticketCode)
    .select()
    .single();

  return { data, error };
};

export const generateTicketCode = () => {
  return "TIX-" + Math.random().toString(36).substr(2, 9).toUpperCase();
};

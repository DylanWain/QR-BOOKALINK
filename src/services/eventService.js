import { supabase } from "../config/supabase";

export const createEvent = async (eventData, userId) => {
  const { data, error } = await supabase
    .from("events")
    .insert([
      {
        user_id: userId,
        event_name: eventData.eventName,
        ticket_price: parseFloat(eventData.ticketPrice),
        total_tickets: eventData.unlimited
          ? 999999
          : parseInt(eventData.totalTickets),
        unlimited: eventData.unlimited,
        host_email: eventData.hostEmail,
        stripe_account_id: eventData.stripeAccountId || null,
        stripe_account_status: eventData.stripeAccountStatus || "not_connected",
        paypal_merchant_id: null,
      },
    ])
    .select()
    .single();

  return { data, error };
};

export const getEvent = async (eventId) => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .single();

  return { data, error };
};

export const getUserEvents = async (userId) => {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return { data, error };
};

export const updateEvent = async (eventId, updates) => {
  const { data, error } = await supabase
    .from("events")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId)
    .select()
    .single();

  return { data, error };
};

export const deleteEvent = async (eventId) => {
  const { error } = await supabase.from("events").delete().eq("id", eventId);

  return { error };
};

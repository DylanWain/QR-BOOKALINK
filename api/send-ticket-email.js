const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      to,
      buyerName,
      eventName,
      ticketCode,
      quantity,
      qrCodeUrl,
      totalPaid,
    } = req.body;

    const { data, error } = await resend.emails.send({
      from: "BookaLink <tickets@bookalink.com>",
      to: [to],
      subject: `🎫 Your Ticket for ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #F3F4F6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 32px; border-radius: 16px; margin-bottom: 24px; text-align: center;">
              <h1 style="color: #FFFFFF; font-size: 32px; font-weight: 900; margin: 0;">🎉 Your Ticket is Ready!</h1>
            </div>

            <!-- Main Card -->
            <div style="background: #FFFFFF; border: 4px solid #000000; border-radius: 20px; padding: 32px; box-shadow: 8px 8px 0px #000000; margin-bottom: 24px;">
              
              <p style="font-size: 18px; margin-bottom: 24px;">Hey ${buyerName}! 👋</p>
              
              <p style="font-size: 16px; margin-bottom: 24px;">Your ticket for <strong>${eventName}</strong> is confirmed and ready to go!</p>

              <!-- QR Code -->
              <div style="text-align: center; margin: 32px 0;">
                <img src="${qrCodeUrl}" alt="QR Code" style="max-width: 300px; width: 100%; height: auto; border: 3px solid #000000; border-radius: 12px;">
                <p style="font-size: 14px; color: #666; margin-top: 12px;">Show this QR code at the door</p>
              </div>

              <!-- Ticket Details -->
              <div style="background: #F9FAFB; border: 2px solid #E5E7EB; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Event</div>
                  <div style="font-size: 18px; font-weight: 800;">${eventName}</div>
                </div>
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Name</div>
                  <div style="font-size: 16px; font-weight: 600;">${buyerName}</div>
                </div>
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Tickets</div>
                  <div style="font-size: 16px; font-weight: 600;">${quantity}</div>
                </div>
                <div style="margin-bottom: 12px;">
                  <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Total Paid</div>
                  <div style="font-size: 16px; font-weight: 600;">$${totalPaid.toFixed(
                    2
                  )}</div>
                </div>
                <div>
                  <div style="font-size: 12px; color: #666; margin-bottom: 4px;">Ticket Code</div>
                  <div style="font-size: 14px; font-weight: 700; font-family: monospace;">${ticketCode}</div>
                </div>
              </div>

              <p style="font-size: 14px; color: #666;">Save this email or download your ticket for easy access at the event.</p>
            </div>

            <!-- Footer -->
            <div style="text-align: center; color: #999; font-size: 12px;">
              <p>Powered by BookaLink</p>
              <p>Questions? Reply to this email.</p>
            </div>

          </div>
        </body>
        </html>
      `,
    });

    if (error) {
      return res.status(400).json({ error });
    }

    res.status(200).json({ data });
  } catch (error) {
    console.error("Email error:", error);
    res.status(500).json({ error: error.message });
  }
};

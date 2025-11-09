const { Resend } = require('resend');
const QRCode = require('qrcode');

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      ticketCode, 
      buyerName, 
      buyerEmail, 
      eventName, 
      quantity, 
      ticketPrice,
      totalPaid 
    } = req.body;

    // Validate required fields
    if (!ticketCode || !buyerName || !buyerEmail || !eventName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate QR code as base64
    const qrCodeDataUrl = await QRCode.toDataURL(ticketCode, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    // Extract base64 data (remove data:image/png;base64, prefix)
    const qrCodeBase64 = qrCodeDataUrl.split(',')[1];

    // Send email with embedded QR code
    const { data, error } = await resend.emails.send({
      from: 'BookaLink Events <onboarding@resend.dev>', // Change this to your domain after verification
      to: [buyerEmail],
      subject: `🎉 Your Ticket for ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Event Ticket</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 4px solid #000000; border-radius: 20px; overflow: hidden; box-shadow: 8px 8px 0px #000000;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; font-size: 36px; font-weight: 900; color: #ffffff; text-shadow: 3px 3px 0px rgba(0,0,0,0.3);">
                        🎉 Ticket Confirmed!
                      </h1>
                      <p style="margin: 10px 0 0 0; font-size: 18px; color: #ffffff; opacity: 0.9;">
                        Your ticket for ${eventName}
                      </p>
                    </td>
                  </tr>

                  <!-- QR Code -->
                  <tr>
                    <td style="padding: 40px 30px; text-align: center;">
                      <div style="background: #ffffff; border: 3px solid #000000; border-radius: 16px; padding: 20px; display: inline-block; margin: 0 auto;">
                        <img src="cid:qrcode" alt="Ticket QR Code" width="300" height="300" style="width: 300px; height: 300px; display: block; max-width: 100%;" />
                      </div>
                      <p style="margin: 20px 0 0 0; font-size: 14px; font-weight: 700; color: #666;">
                        📱 Show this QR code at the event entrance
                      </p>
                    </td>
                  </tr>

                  <!-- Ticket Details -->
                  <tr>
                    <td style="padding: 0 30px 40px 30px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                        
                        <!-- Ticket Code -->
                        <tr>
                          <td style="padding: 16px; border-bottom: 2px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="font-size: 14px; color: #666; font-weight: 600;">Ticket Code</td>
                                <td align="right" style="font-size: 14px; font-weight: 800; font-family: 'Courier New', monospace; color: #000000;">
                                  ${ticketCode}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Name -->
                        <tr>
                          <td style="padding: 16px; border-bottom: 2px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="font-size: 14px; color: #666; font-weight: 600;">Name</td>
                                <td align="right" style="font-size: 14px; font-weight: 700; color: #000000;">
                                  ${buyerName}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Email -->
                        <tr>
                          <td style="padding: 16px; border-bottom: 2px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="font-size: 14px; color: #666; font-weight: 600;">Email</td>
                                <td align="right" style="font-size: 14px; font-weight: 700; color: #000000; word-break: break-all;">
                                  ${buyerEmail}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Quantity -->
                        <tr>
                          <td style="padding: 16px; border-bottom: 2px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="font-size: 14px; color: #666; font-weight: 600;">Quantity</td>
                                <td align="right" style="font-size: 14px; font-weight: 700; color: #000000;">
                                  ${quantity} ticket${quantity !== 1 ? 's' : ''}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Price per ticket -->
                        <tr>
                          <td style="padding: 16px; border-bottom: 2px solid #e5e7eb;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="font-size: 14px; color: #666; font-weight: 600;">Price per Ticket</td>
                                <td align="right" style="font-size: 14px; font-weight: 700; color: #000000;">
                                  $${parseFloat(ticketPrice).toFixed(2)}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <!-- Total Paid -->
                        <tr>
                          <td style="padding: 16px;">
                            <table width="100%" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="font-size: 16px; color: #666; font-weight: 700;">Total Paid</td>
                                <td align="right" style="font-size: 20px; font-weight: 900; color: #10B981;">
                                  $${parseFloat(totalPaid).toFixed(2)}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>

                  <!-- Important Notice -->
                  <tr>
                    <td style="padding: 0 30px 40px 30px;">
                      <div style="background-color: #fff9db; border: 2px solid #f59e0b; border-radius: 12px; padding: 16px;">
                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400e; line-height: 1.6;">
                          ⚠️ <strong>Important:</strong> Save this email or take a screenshot of the QR code. You'll need to show it at the event entrance for check-in.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Tips -->
                  <tr>
                    <td style="padding: 0 30px 40px 30px;">
                      <div style="background-color: #f0f9ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 16px;">
                        <p style="margin: 0 0 12px 0; font-size: 14px; font-weight: 700; color: #1e40af;">
                          💡 Pro Tips:
                        </p>
                        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #1e40af; line-height: 1.8;">
                          <li>Download this email for offline access</li>
                          <li>Take a screenshot of your QR code</li>
                          <li>Arrive early to avoid long lines</li>
                          <li>Keep your ticket secure and don't share it</li>
                        </ul>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; text-align: center; background-color: #f9fafb; border-top: 2px solid #e5e7eb;">
                      <p style="margin: 0 0 10px 0; font-size: 16px; font-weight: 800; color: #667eea;">
                        BookaLink Events
                      </p>
                      <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">
                        Your all-in-one event ticketing platform
                      </p>
                      <p style="margin: 0; font-size: 12px; color: #999;">
                        Questions? Contact the event organizer
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrCodeBase64,
          content_id: 'qrcode',
          disposition: 'inline'
        }
      ]
    });

    if (error) {
      console.error('Resend error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Email sent successfully:', data);
    res.status(200).json({ success: true, emailId: data.id });

  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email' });
  }
}

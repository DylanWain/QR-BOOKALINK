import { Resend } from 'resend';
import QRCode from 'qrcode';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

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

    // Validate
    if (!ticketCode || !buyerName || !buyerEmail || !eventName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate QR code
    const qrCodeDataUrl = await QRCode.toDataURL(ticketCode, {
      width: 400,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    const qrCodeBase64 = qrCodeDataUrl.split(',')[1];

    // Send email
    const { data, error } = await resend.emails.send({
      from: 'BookaLink Events <tickets@bookalink.com>',
      to: [buyerEmail],
      subject: `🎉 Your Ticket for ${eventName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f3f4f6;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 4px solid #000000; border-radius: 20px; overflow: hidden;">
                  
                  <tr>
                    <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                      <h1 style="margin: 0; font-size: 36px; font-weight: 900; color: #ffffff;">
                        🎉 Ticket Confirmed!
                      </h1>
                      <p style="margin: 10px 0 0 0; font-size: 18px; color: #ffffff; opacity: 0.9;">
                        Your ticket for ${eventName}
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 40px 30px; text-align: center;">
                      <img src="cid:qrcode" alt="QR Code" width="300" height="300" style="display: block; margin: 0 auto; border: 3px solid #000000; border-radius: 16px; padding: 20px;" />
                      <p style="margin: 20px 0 0 0; font-size: 14px; font-weight: 700; color: #666;">
                        📱 Show this QR code at the event entrance
                      </p>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 30px 40px 30px;">
                      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px;">
                        
                        <tr>
                          <td style="padding: 16px; border-bottom: 2px solid #e5e7eb;">
                            <table width="100%">
                              <tr>
                                <td style="font-size: 14px; color: #666;">Ticket Code</td>
                                <td align="right" style="font-size: 14px; font-weight: 800; font-family: monospace;">${ticketCode}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 16px; border-bottom: 2px solid #e5e7eb;">
                            <table width="100%">
                              <tr>
                                <td style="font-size: 14px; color: #666;">Name</td>
                                <td align="right" style="font-size: 14px; font-weight: 700;">${buyerName}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 16px; border-bottom: 2px solid #e5e7eb;">
                            <table width="100%">
                              <tr>
                                <td style="font-size: 14px; color: #666;">Quantity</td>
                                <td align="right" style="font-size: 14px; font-weight: 700;">${quantity} ticket${quantity !== 1 ? 's' : ''}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 16px;">
                            <table width="100%">
                              <tr>
                                <td style="font-size: 16px; color: #666; font-weight: 700;">Total Paid</td>
                                <td align="right" style="font-size: 20px; font-weight: 900; color: #10B981;">$${parseFloat(totalPaid).toFixed(2)}</td>
                              </tr>
                            </table>
                          </td>
                        </tr>

                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 0 30px 40px 30px;">
                      <div style="background-color: #fff9db; border: 2px solid #f59e0b; border-radius: 12px; padding: 16px;">
                        <p style="margin: 0; font-size: 14px; font-weight: 600; color: #92400e;">
                          ⚠️ <strong>Important:</strong> Save this email or screenshot the QR code. You'll need it at the event entrance.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding: 30px; text-align: center; background-color: #f9fafb;">
                      <p style="margin: 0; font-size: 16px; font-weight: 800; color: #667eea;">BookaLink Events</p>
                      <p style="margin: 5px 0 0 0; font-size: 12px; color: #999;">Your all-in-one ticketing platform</p>
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

    console.log('Email sent:', data);
    return res.status(200).json({ success: true, emailId: data.id });

  } catch (error) {
    console.error('Handler error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}

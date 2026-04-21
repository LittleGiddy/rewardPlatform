import nodemailer from 'nodemailer';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD, // Use App Password, not regular password
  },
});

interface WinnerEmailParams {
  userName?: string;
  userPhone?: string;
  userNetwork: string;
  voucherAmount: number;
  voucherCode: string;
  winnerId: string;
  wonAt: Date;
}

export async function sendWinnerNotification(winner: WinnerEmailParams) {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
  
  const subject = `🎉 NEW WINNER! ${winner.userNetwork} - TZS ${winner.voucherAmount}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <div style="text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0; margin: -20px -20px 20px -20px;">
        <h1 style="color: white; margin: 0;">🎉 NEW WINNER! 🎉</h1>
      </div>
      
      <div style="padding: 0 20px;">
        <p style="font-size: 18px; color: #333;"><strong>Someone just won a voucher on Vuna Vocha!</strong></p>
        
        <div style="background: #f0f0f0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4CAF50;">Winner Details:</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Network:</td>
              <td style="padding: 8px 0;">${winner.userNetwork}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Amount Won:</td>
              <td style="padding: 8px 0; color: #4CAF50; font-size: 20px; font-weight: bold;">TZS ${winner.voucherAmount.toLocaleString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Voucher Code:</td>
              <td style="padding: 8px 0; font-family: monospace; font-size: 16px; background: #fff; padding: 5px 10px; border-radius: 5px; display: inline-block;">${winner.voucherCode}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Winner ID:</td>
              <td style="padding: 8px 0; font-family: monospace;">${winner.winnerId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: bold;">Time Won:</td>
              <td style="padding: 8px 0;">${new Date(winner.wonAt).toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        ${winner.userName && `
        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">User Info:</h3>
          <p><strong>Name:</strong> ${winner.userName}</p>
          <p><strong>Phone:</strong> ${winner.userPhone || 'Not provided'}</p>
        </div>
        `}
        
        <div style="background: #fff3e0; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #ff9800;">⚠️ Please ensure this voucher code has been sent to the winner or is available in their account.</p>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        
        <p style="color: #999; font-size: 12px; text-align: center;">
          Sent from Vuna Vocha Admin System<br>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin" style="color: #667eea;">Go to Admin Panel</a>
        </p>
      </div>
    </div>
  `;
  
  const text = `
    NEW WINNER!
    
    Network: ${winner.userNetwork}
    Amount: TZS ${winner.voucherAmount}
    Voucher Code: ${winner.voucherCode}
    Winner ID: ${winner.winnerId}
    Time: ${new Date(winner.wonAt).toLocaleString()}
    
    View in admin panel: ${process.env.NEXT_PUBLIC_BASE_URL}/admin
  `;
  
  try {
    await transporter.sendMail({
      from: `"Vuna Vocha" <${process.env.EMAIL_USER}>`,
      to: adminEmail,
      subject: subject,
      text: text,
      html: html,
    });
    
    console.log('[EMAIL] Winner notification sent to:', adminEmail);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Failed to send email:', error);
    return { success: false, error };
  }
}
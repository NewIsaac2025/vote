interface EmailData {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async (data: EmailData): Promise<boolean> => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase configuration is missing');
      return false;
    }

    // Validate email format before sending
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.to)) {
      console.error('Invalid email format:', data.to);
      return false;
    }

    console.log('Sending email to:', data.to);

    const response = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Email sending failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      return false;
    }

    const result = await response.json();
    console.log('Email sent successfully:', result);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

export const generateOTPEmail = (otp: string, name: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>UniVote - Email Verification</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #0F172A;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 20px;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .header {
          background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: shimmer 3s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
        }
        
        .logo {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          position: relative;
          z-index: 1;
        }
        
        .logo svg {
          width: 40px;
          height: 40px;
          color: white;
        }
        
        .header h1 {
          color: white;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }
        
        .header p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          font-weight: 500;
          position: relative;
          z-index: 1;
        }
        
        .content {
          padding: 50px 40px;
        }
        
        .greeting {
          font-size: 24px;
          font-weight: 600;
          color: #0F172A;
          margin-bottom: 24px;
        }
        
        .message {
          font-size: 16px;
          color: #475569;
          margin-bottom: 40px;
          line-height: 1.7;
        }
        
        .otp-container {
          background: linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%);
          border: 3px dashed #2563EB;
          border-radius: 16px;
          padding: 40px 30px;
          text-align: center;
          margin: 40px 0;
          position: relative;
          overflow: hidden;
        }
        
        .otp-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(37, 99, 235, 0.1), transparent);
          animation: slide 2s infinite;
        }
        
        @keyframes slide {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        .otp-label {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
          margin-bottom: 16px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          position: relative;
          z-index: 1;
        }
        
        .otp-code {
          font-size: 48px;
          font-weight: 800;
          color: #2563EB;
          letter-spacing: 8px;
          font-family: 'Courier New', monospace;
          margin-bottom: 16px;
          text-shadow: 0 2px 4px rgba(37, 99, 235, 0.2);
          position: relative;
          z-index: 1;
        }
        
        .otp-expiry {
          font-size: 12px;
          color: #64748B;
          font-weight: 500;
          position: relative;
          z-index: 1;
        }
        
        .security-notice {
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
          border-left: 4px solid #F59E0B;
          padding: 20px;
          border-radius: 12px;
          margin: 30px 0;
        }
        
        .security-notice h3 {
          color: #92400E;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .security-notice p {
          color: #B45309;
          font-size: 14px;
          margin: 0;
        }
        
        .footer {
          background: #F8FAFC;
          padding: 30px 40px;
          border-top: 1px solid #E2E8F0;
          text-align: center;
        }
        
        .footer p {
          color: #64748B;
          font-size: 12px;
          margin-bottom: 16px;
        }
        
        .social-links {
          display: flex;
          justify-content: center;
          gap: 16px;
          margin-top: 20px;
        }
        
        .social-link {
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #E2E8F0 0%, #CBD5E1 100%);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.3s ease;
        }
        
        .social-link:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
        }
        
        @media (max-width: 600px) {
          .container {
            margin: 20px;
            border-radius: 16px;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .otp-code {
            font-size: 36px;
            letter-spacing: 4px;
          }
          
          .header {
            padding: 30px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <h1>UniVote</h1>
          <p>Secure • Transparent • Democratic</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <h2 class="greeting">Hello ${name}! 👋</h2>
          
          <p class="message">
            Welcome to the future of democratic participation! We're excited to have you join our secure, blockchain-powered voting platform. To complete your registration and verify your email address, please use the verification code below:
          </p>
          
          <!-- OTP Container -->
          <div class="otp-container">
            <p class="otp-label">Your Verification Code</p>
            <div class="otp-code">${otp}</div>
            <p class="otp-expiry">⏰ This code expires in 10 minutes</p>
          </div>
          
          <!-- Security Notice -->
          <div class="security-notice">
            <h3>🔒 Security Notice</h3>
            <p>Never share this code with anyone. UniVote staff will never ask for your verification code via phone, email, or any other method.</p>
          </div>
          
          <p class="message">
            Once verified, you'll be able to participate in elections, view real-time results, and help shape the future of your university community. Your vote matters, and we're here to ensure it's counted securely and transparently.
          </p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p>This is an automated message from UniVote. Please do not reply to this email.</p>
          <p>If you didn't request this verification code, please ignore this email or contact our support team at support@tradestacks.finance.</p>
          
          <div class="social-links">
            <a href="mailto:support@tradestacks.finance" class="social-link">📧</a>
            <a href="https://tradestacks.finance" class="social-link">🌐</a>
            <a href="#" class="social-link">📱</a>
          </div>
          
          <p style="margin-top: 20px; color: #94A3B8; font-size: 11px;">
            © 2025 UniVote by TradeStacks. All rights reserved. Powered by blockchain technology.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateWelcomeEmail = (name: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to UniVote!</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #0F172A;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          padding: 40px 20px;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .header {
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: celebrate 4s ease-in-out infinite;
        }
        
        @keyframes celebrate {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(180deg); }
        }
        
        .logo {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          position: relative;
          z-index: 1;
        }
        
        .header h1 {
          color: white;
          font-size: 32px;
          font-weight: 700;
          margin-bottom: 8px;
          position: relative;
          z-index: 1;
        }
        
        .header p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 18px;
          font-weight: 500;
          position: relative;
          z-index: 1;
        }
        
        .content {
          padding: 50px 40px;
        }
        
        .celebration {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .celebration h2 {
          font-size: 28px;
          font-weight: 700;
          color: #0F172A;
          margin-bottom: 16px;
        }
        
        .celebration p {
          font-size: 18px;
          color: #475569;
          margin-bottom: 24px;
        }
        
        .features {
          background: linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%);
          border-radius: 16px;
          padding: 30px;
          margin: 30px 0;
        }
        
        .features h3 {
          color: #0369A1;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .feature-list {
          list-style: none;
          padding: 0;
        }
        
        .feature-list li {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
          font-size: 16px;
          color: #0F172A;
        }
        
        .feature-list li::before {
          content: '✨';
          margin-right: 12px;
          font-size: 18px;
        }
        
        .cta-section {
          background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%);
          border-radius: 16px;
          padding: 30px;
          text-align: center;
          margin: 30px 0;
          color: white;
        }
        
        .cta-section h3 {
          font-size: 22px;
          font-weight: 600;
          margin-bottom: 16px;
        }
        
        .cta-section p {
          margin-bottom: 24px;
          opacity: 0.9;
        }
        
        .cta-button {
          display: inline-block;
          background: rgba(255, 255, 255, 0.2);
          color: white;
          padding: 16px 32px;
          border-radius: 12px;
          text-decoration: none;
          font-weight: 600;
          font-size: 16px;
          transition: all 0.3s ease;
          backdrop-filter: blur(10px);
        }
        
        .cta-button:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }
        
        .footer {
          background: #F8FAFC;
          padding: 30px 40px;
          border-top: 1px solid #E2E8F0;
          text-align: center;
        }
        
        .footer p {
          color: #64748B;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        @media (max-width: 600px) {
          .container {
            margin: 20px;
            border-radius: 16px;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .header {
            padding: 30px 20px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="logo">🎉</div>
          <h1>Welcome to UniVote!</h1>
          <p>Your journey to democratic participation begins now</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <div class="celebration">
            <h2>Congratulations, ${name}! 🎊</h2>
            <p>Your account has been successfully verified and you're now part of our secure, transparent voting community.</p>
          </div>
          
          <!-- Features -->
          <div class="features">
            <h3>🚀 What You Can Do Now</h3>
            <ul class="feature-list">
              <li>Connect your MetaMask wallet for secure blockchain voting</li>
              <li>Browse active elections and candidate profiles</li>
              <li>Cast your vote with complete transparency and security</li>
              <li>View real-time results and election analytics</li>
              <li>Participate in shaping your university's future</li>
            </ul>
          </div>
          
          <!-- CTA Section -->
          <div class="cta-section">
            <h3>Ready to Make Your Voice Heard? 🗳️</h3>
            <p>Join thousands of students already participating in secure, democratic elections.</p>
            <a href="https://tradestacks.finance" class="cta-button">Start Voting Now →</a>
          </div>
          
          <p style="color: #475569; font-size: 16px; text-align: center; margin-top: 30px;">
            Remember: Your vote is your voice. Use it wisely and make a difference in your university community. Every vote matters and contributes to a better future for all students.
          </p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p><strong>Need help getting started?</strong></p>
          <p>Check out our voting guide or contact our support team at support@tradestacks.finance</p>
          <p style="margin-top: 20px; color: #94A3B8; font-size: 12px;">
            © 2025 UniVote by TradeStacks. All rights reserved. Powered by blockchain technology for maximum security and transparency.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const generateVoteConfirmationEmail = (name: string, candidateName: string, electionTitle: string): string => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Vote Confirmation - UniVote</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          line-height: 1.6;
          color: #0F172A;
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          padding: 40px 20px;
        }
        
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .header {
          background: linear-gradient(135deg, #059669 0%, #047857 100%);
          padding: 40px 30px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .success-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          font-size: 40px;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        .header h1 {
          color: white;
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .header p {
          color: rgba(255, 255, 255, 0.9);
          font-size: 16px;
          font-weight: 500;
        }
        
        .content {
          padding: 50px 40px;
        }
        
        .vote-details {
          background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%);
          border: 2px solid #BBF7D0;
          border-radius: 16px;
          padding: 30px;
          margin: 30px 0;
        }
        
        .vote-details h3 {
          color: #047857;
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          text-align: center;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #DCFCE7;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          font-weight: 500;
          color: #374151;
        }
        
        .detail-value {
          color: #047857;
          font-weight: 600;
        }
        
        .blockchain-info {
          background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);
          border-left: 4px solid #2563EB;
          padding: 20px;
          border-radius: 12px;
          margin: 30px 0;
        }
        
        .blockchain-info h4 {
          color: #1E40AF;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .blockchain-info p {
          color: #1E3A8A;
          font-size: 14px;
        }
        
        .footer {
          background: #F8FAFC;
          padding: 30px 40px;
          border-top: 1px solid #E2E8F0;
          text-align: center;
        }
        
        .footer p {
          color: #64748B;
          font-size: 14px;
          margin-bottom: 8px;
        }
        
        @media (max-width: 600px) {
          .container {
            margin: 20px;
            border-radius: 16px;
          }
          
          .content {
            padding: 30px 20px;
          }
          
          .header {
            padding: 30px 20px;
          }
          
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <!-- Header -->
        <div class="header">
          <div class="success-icon">✅</div>
          <h1>Vote Successfully Cast!</h1>
          <p>Your voice has been heard and recorded securely</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <h2 style="font-size: 24px; font-weight: 600; color: #0F172A; margin-bottom: 20px; text-align: center;">
            Thank you, ${name}! 🎉
          </h2>
          
          <p style="font-size: 16px; color: #475569; margin-bottom: 30px; text-align: center;">
            Your vote has been successfully recorded and secured on the blockchain. Here are the details of your participation:
          </p>
          
          <!-- Vote Details -->
          <div class="vote-details">
            <h3>📊 Vote Details</h3>
            <div class="detail-row">
              <span class="detail-label">Election:</span>
              <span class="detail-value">${electionTitle}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Candidate:</span>
              <span class="detail-value">${candidateName}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Time:</span>
              <span class="detail-value">${new Date().toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value">✅ Confirmed</span>
            </div>
          </div>
          
          <!-- Blockchain Info -->
          <div class="blockchain-info">
            <h4>🔗 Blockchain Security</h4>
            <p>Your vote has been cryptographically secured and recorded on the blockchain, ensuring complete transparency, immutability, and anonymity. This technology guarantees that your vote cannot be altered, deleted, or duplicated.</p>
          </div>
          
          <p style="color: #475569; font-size: 16px; text-align: center; margin-top: 30px;">
            <strong>Important:</strong> Your vote is anonymous, secure, and cannot be changed. Thank you for participating in the democratic process and helping shape the future of your university community!
          </p>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <p><strong>Want to see the results?</strong></p>
          <p>Visit our results page to view real-time election updates and final outcomes.</p>
          <p>Questions? Contact us at support@tradestacks.finance</p>
          <p style="margin-top: 20px; color: #94A3B8; font-size: 12px;">
            © 2025 UniVote by TradeStacks. All rights reserved. Your vote, your voice, secured by blockchain.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};
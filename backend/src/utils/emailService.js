const SibApiV3Sdk = require('sib-api-v3-sdk');

const defaultClient = SibApiV3Sdk.ApiClient.instance;
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

/**
 * Sends a notification email for a workflow step.
 */
async function sendNotificationEmail(to, subject, stepName, workflowName, inputData) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.subject = subject || `🔔 Workflow Notification: ${stepName}`;
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.sender = { 
    email: process.env.EMAIL_USER, 
    name: 'WF Engine' 
  };

  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: #09090b; padding: 30px; text-align: center;">
        <h1 style="color: #10b981; margin: 0; font-size: 28px; letter-spacing: -1px;">HALLEYX</h1>
        <p style="color: #666; margin: 5px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Workflow Engine</p>
      </div>
      <div style="padding: 40px; background: #fff; color: #333;">
        <h2 style="margin-top: 0; color: #000;">🔔 Protocol Alert</h2>
        <p style="font-size: 14px; color: #666; line-height: 1.6;">Automated notification triggered by system architecture orchestration.</p>
        
        <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <p style="margin: 0 0 5px 0; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #94a3b8;">Workflow</p>
            <p style="margin: 0; font-size: 16px; font-weight: 700;">${workflowName}</p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <p style="margin: 0 0 5px 0; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #94a3b8;">Current Step</p>
            <p style="margin: 0; font-size: 16px; font-weight: 700;">${stepName}</p>
        </div>

        <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px;">Trace Data</p>
        <div style="background: #09090b; border-radius: 8px; padding: 20px; color: #10b981; font-family: monospace; font-size: 12px; overflow-x: auto;">
          <pre style="margin: 0;">${JSON.stringify(inputData, null, 2)}</pre>
        </div>
        
        <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; text-align: center;">
          Timestamp: ${new Date().toLocaleString()}
        </p>
      </div>
      <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #eee;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">&copy; 2026 Core Workflow Systems. All rights reserved.</p>
      </div>
    </div>
  `;
  
  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Email sent via Brevo (SIB SDK) to:', to, '| Response:', JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('❌ Brevo email error:', error.message);
    return false;
  }
}

/**
 * Sends an approval request email.
 */
async function sendApprovalEmail(to, stepName, workflowName, inputData, executionId) {
  const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
  
  sendSmtpEmail.subject = `⏳ Action Required: ${stepName} - ${workflowName}`;
  sendSmtpEmail.to = [{ email: to }];
  sendSmtpEmail.sender = { 
    email: process.env.EMAIL_USER, 
    name: 'WF Engine' 
  };

  // Construct login link
  const loginLink = `http://localhost:5173/login`;

  sendSmtpEmail.htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
      <div style="background: #09090b; padding: 30px; text-align: center;">
        <h1 style="color: #10b981; margin: 0; font-size: 28px; letter-spacing: -1px;">HALLEYX</h1>
        <p style="color: #666; margin: 5px 0 0 0; font-size: 10px; text-transform: uppercase; letter-spacing: 2px;">Workflow Engine</p>
      </div>
      <div style="padding: 40px; background: #fff; color: #333;">
        <h2 style="margin-top: 0; color: #000;">⏳ Approval Required</h2>
        <p style="font-size: 14px; color: #666; line-height: 1.6;">A workflow execution has paused and requires your immediate approval.</p>
        
        <div style="background: #f8fafc; border: 1px solid #f1f5f9; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <p style="margin: 0 0 5px 0; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #94a3b8;">Workflow Context</p>
            <p style="margin: 0; font-size: 16px; font-weight: 700;">${workflowName}</p>
        </div>

        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <p style="margin: 0 0 5px 0; font-size: 10px; text-transform: uppercase; font-weight: 800; color: #166534;">Pending Step</p>
            <p style="margin: 0; font-size: 16px; font-weight: 700; color: #166534;">${stepName}</p>
        </div>

        <p style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #94a3b8; margin-bottom: 10px;">Payload Trace</p>
        <div style="background: #09090b; border-radius: 8px; padding: 20px; color: #10b981; font-family: monospace; font-size: 12px; overflow-x: auto;">
          <pre style="margin: 0;">${JSON.stringify(inputData, null, 2)}</pre>
        </div>

        <div style="text-align:center; margin: 40px 0;">
          <a href="${loginLink}" 
             style="background: #10b981; color: #fff; padding: 18px 40px;
                    text-decoration: none; border-radius: 12px; font-weight: 900; 
                    text-transform: uppercase; font-size: 12px; letter-spacing: 1px;
                    box-shadow: 0 10px 20px rgba(16,185,129,0.2);">
            🔐 Login to Approve
          </a>
        </div>
        
        <p style="font-size: 11px; color: #94a3b8; margin-top: 30px; text-align: center;">
          Timestamp: ${new Date().toLocaleString()}
        </p>
      </div>
      <div style="background: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #eee;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0;">&copy; 2026 Core Workflow Systems. All rights reserved.</p>
      </div>
    </div>
  `;
  
  try {
    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log('✅ Approval email sent via Brevo (SIB SDK) to:', to, '| Response:', JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('❌ Brevo approval email error:', error.message);
    return false;
  }
}

module.exports = { sendNotificationEmail, sendApprovalEmail };

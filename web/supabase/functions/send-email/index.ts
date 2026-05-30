import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  secure: boolean;
}

async function sendWithSMTP(config: SMTPConfig, email: EmailRequest): Promise<{ success: boolean; message: string }> {
  console.log(`Sending email via SMTP to: ${email.to}`);
  console.log(`SMTP Host: ${config.host}:${config.port}`);
  console.log(`From: ${config.from_name} <${config.from_email}>`);
  console.log(`Subject: ${email.subject}`);

  try {
    const client = new SMTPClient({
      connection: {
        hostname: config.host,
        port: config.port,
        tls: config.secure,
        auth: {
          username: config.username,
          password: config.password,
        },
      },
    });

    const recipients = Array.isArray(email.to) ? email.to : [email.to];
    
    await client.send({
      from: `${config.from_name} <${config.from_email}>`,
      to: recipients,
      subject: email.subject,
      content: email.text || "",
      html: email.html,
    });

    await client.close();
    
    console.log("Email sent successfully via SMTP");
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("SMTP error:", error);
    return { success: false, message: error instanceof Error ? error.message : "Failed to send email via SMTP" };
  }
}

async function sendWithResend(apiKey: string, from: string, email: EmailRequest): Promise<{ success: boolean; message: string; id?: string }> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from,
      to: Array.isArray(email.to) ? email.to : [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error("Resend error:", result);
    return { success: false, message: result.message || "Failed to send email" };
  }

  console.log("Email sent successfully via Resend:", result);
  return { success: true, message: "Email sent successfully", id: result.id };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { action, ...payload } = body;

    console.log(`Email action: ${action}`);

    // Helper function to log email
    async function logEmail(
      toEmail: string,
      subject: string,
      status: "pending" | "success" | "failed",
      options?: {
        toName?: string;
        templateType?: string;
        errorMessage?: string;
        metadata?: Record<string, unknown>;
        sentBy?: string;
      }
    ) {
      try {
        await supabaseClient.from("email_logs").insert({
          to_email: toEmail,
          to_name: options?.toName || null,
          subject: subject,
          template_type: options?.templateType || null,
          status: status,
          error_message: options?.errorMessage || null,
          metadata: options?.metadata || {},
          sent_by: options?.sentBy || null,
          sent_at: status === "success" ? new Date().toISOString() : null,
        });
      } catch (err) {
        console.error("Failed to log email:", err);
      }
    }

    // Get email settings from admin_settings
    const { data: settings } = await supabaseClient
      .from("admin_settings")
      .select("*")
      .in("key", [
        "email_provider", 
        "smtp_host", 
        "smtp_port", 
        "smtp_username", 
        "smtp_password", 
        "smtp_from_email", 
        "smtp_from_name", 
        "smtp_secure"
      ]);

    const settingsMap: Record<string, unknown> = {};
    settings?.forEach((s: { key: string; value: unknown }) => {
      settingsMap[s.key] = s.value;
    });

    const emailProvider = (settingsMap.email_provider as string) || "smtp";
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Build SMTP config from individual settings
    const smtpConfig: SMTPConfig = {
      host: emailProvider === "gmail" ? "smtp.gmail.com" : (settingsMap.smtp_host as string) || "",
      port: emailProvider === "gmail" ? 465 : (settingsMap.smtp_port as number) || 587,
      username: (settingsMap.smtp_username as string) || "",
      password: (settingsMap.smtp_password as string) || "",
      from_email: (settingsMap.smtp_from_email as string) || "",
      from_name: (settingsMap.smtp_from_name as string) || "LifeOS",
      secure: emailProvider === "gmail" ? true : (settingsMap.smtp_secure as boolean) ?? true,
    };

    console.log("Email provider:", emailProvider);
    console.log("SMTP config host:", smtpConfig.host);

    switch (action) {
      case "send": {
        const { to, subject, html, text, templateType, sentBy } = payload as EmailRequest & { templateType?: string; sentBy?: string };
        
        if (!to || !subject || !html) {
          return new Response(
            JSON.stringify({ error: "Missing required fields: to, subject, html" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const recipients = Array.isArray(to) ? to : [to];
        let result;
        
        if ((emailProvider === "smtp" || emailProvider === "gmail") && smtpConfig.host && smtpConfig.username) {
          result = await sendWithSMTP(smtpConfig, { to, subject, html, text });
        } else if (emailProvider === "resend" && resendApiKey) {
          const fromEmail = smtpConfig.from_email || "onboarding@resend.dev";
          const fromName = smtpConfig.from_name || "LifeOS";
          result = await sendWithResend(resendApiKey, `${fromName} <${fromEmail}>`, { to, subject, html, text });
        } else {
          console.log("No email provider configured. Email would be sent to:", to);
          console.log("Subject:", subject);
          result = { success: true, message: "Email logged (no provider configured)" };
        }

        // Log each recipient
        for (const recipient of recipients) {
          await logEmail(recipient, subject, result.success ? "success" : "failed", {
            templateType: templateType || "custom",
            errorMessage: result.success ? undefined : result.message,
            sentBy,
          });
        }

        return new Response(
          JSON.stringify(result),
          { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send-notification": {
        const { userId, subject, template, data } = payload;
        
        // Get user email from profiles
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("email, name")
          .eq("id", userId)
          .single();

        if (!profile?.email) {
          return new Response(
            JSON.stringify({ error: "User email not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const html = generateEmailHtml(template, { ...data, userName: profile.name });
        const result = resendApiKey 
          ? await sendWithResend(resendApiKey, "LifeOS <onboarding@resend.dev>", { to: profile.email, subject, html })
          : { success: true, message: "Email logged (no provider configured)" };

        return new Response(
          JSON.stringify(result),
          { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send-password-reset": {
        const { userId } = payload;
        
        // Get user email
        const { data: profile } = await supabaseClient
          .from("profiles")
          .select("email, name")
          .eq("id", userId)
          .single();

        if (!profile?.email) {
          return new Response(
            JSON.stringify({ error: "User email not found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Generate password reset link using Supabase Auth Admin
        const { data: resetData, error: resetError } = await supabaseClient.auth.admin.generateLink({
          type: "recovery",
          email: profile.email,
        });

        if (resetError) {
          console.error("Password reset error:", resetError);
          return new Response(
            JSON.stringify({ error: resetError.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const resetLink = resetData.properties?.action_link;
        const html = generateEmailHtml("password-reset", { 
          userName: profile.name || profile.email,
          resetLink 
        });

        const result = resendApiKey
          ? await sendWithResend(resendApiKey, "LifeOS <onboarding@resend.dev>", { 
              to: profile.email, 
              subject: "Reset Your Password - LifeOS", 
              html 
            })
          : { success: true, message: "Password reset email logged", resetLink };

        return new Response(
          JSON.stringify({ ...result, email: profile.email }),
          { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "send-bulk": {
        const { userIds, subject, template, data } = payload;
        
        // Get all user emails
        const { data: profiles } = await supabaseClient
          .from("profiles")
          .select("id, email, name")
          .in("id", userIds);

        if (!profiles || profiles.length === 0) {
          return new Response(
            JSON.stringify({ error: "No users found" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const results = [];
        for (const profile of profiles) {
          if (profile.email) {
            const html = generateEmailHtml(template, { ...data, userName: profile.name });
            const result = resendApiKey
              ? await sendWithResend(resendApiKey, "LifeOS <onboarding@resend.dev>", { to: profile.email, subject, html })
              : { success: true, message: "Email logged" };
            results.push({ userId: profile.id, email: profile.email, ...result });
          }
        }

        return new Response(
          JSON.stringify({ sent: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "test-smtp": {
        const { config, testEmail } = payload as { config: SMTPConfig; testEmail: string };
        
        console.log("Testing SMTP configuration...");
        const result = await sendWithSMTP(config, {
          to: testEmail,
          subject: "SMTP Test - LifeOS",
          html: "<h1>SMTP Test Successful!</h1><p>Your SMTP configuration is working correctly.</p>",
        });

        return new Response(
          JSON.stringify(result),
          { status: result.success ? 200 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: unknown) {
    console.error("Email function error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

function generateEmailHtml(template: string, data: Record<string, unknown>): string {
  const userName = data.userName || "User";
  const appName = "LifeOS";
  
  const baseStyle = `
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
  `;

  const templates: Record<string, string> = {
    "welcome": `
      <div style="${baseStyle}">
        <h1 style="color: #6366f1;">Welcome to ${appName}!</h1>
        <p>Hi ${userName},</p>
        <p>Welcome to ${appName}! We're excited to have you on board.</p>
        <p>Start organizing your life today with goals, habits, tasks, and more.</p>
        <p>Best regards,<br>The ${appName} Team</p>
      </div>
    `,
    "password-reset": `
      <div style="${baseStyle}">
        <h1 style="color: #6366f1;">Reset Your Password</h1>
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password. Click the link below to set a new password:</p>
        <p style="margin: 24px 0;">
          <a href="${data.resetLink}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this, you can safely ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br>The ${appName} Team</p>
      </div>
    `,
    "notification": `
      <div style="${baseStyle}">
        <h1 style="color: #6366f1;">${data.title || 'Notification'}</h1>
        <p>Hi ${userName},</p>
        <p>${data.message || ''}</p>
        <p>Best regards,<br>The ${appName} Team</p>
      </div>
    `,
    "custom": `
      <div style="${baseStyle}">
        ${data.content || ''}
      </div>
    `,
  };

  return templates[template] || templates["notification"];
}

serve(handler);

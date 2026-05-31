// Email transport for the send-email endpoint. Configuration comes from the
// backend environment (Resend preferred, SMTP fallback). Ported from the legacy
// send-email Supabase Edge Function; the admin_settings/email_logs tables are not
// ported yet, so config is env-based and sending is a no-op when unconfigured.

import nodemailer from 'nodemailer';
import { env } from '../env';

export interface EmailMessage {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export interface SendResult {
  success: boolean;
  message: string;
  id?: string;
}

export type EmailProvider = 'resend' | 'smtp' | 'none';

export function emailProvider(): EmailProvider {
  if (env.RESEND_API_KEY) return 'resend';
  if (env.SMTP_HOST && env.SMTP_USERNAME) return 'smtp';
  return 'none';
}

function fromHeader(): string {
  const name = env.EMAIL_FROM_NAME || 'LifeOS';
  const email = env.EMAIL_FROM || 'onboarding@resend.dev';
  return `${name} <${email}>`;
}

async function sendWithResend(message: EmailMessage): Promise<SendResult> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromHeader(),
      to: Array.isArray(message.to) ? message.to : [message.to],
      subject: message.subject,
      html: message.html,
      text: message.text,
    }),
  });
  const result = (await response.json().catch(() => ({}))) as { id?: string; message?: string };
  if (!response.ok) {
    return { success: false, message: result.message || 'Failed to send email via Resend' };
  }
  return { success: true, message: 'Email sent successfully', id: result.id };
}

async function sendWithSmtp(message: EmailMessage): Promise<SendResult> {
  try {
    const port = env.SMTP_PORT ?? 587;
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: env.SMTP_USERNAME, pass: env.SMTP_PASSWORD },
    });
    const info = await transporter.sendMail({
      from: fromHeader(),
      to: Array.isArray(message.to) ? message.to.join(', ') : message.to,
      subject: message.subject,
      text: message.text || '',
      html: message.html,
    });
    return { success: true, message: 'Email sent successfully', id: info.messageId };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : 'Failed to send email via SMTP' };
  }
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const provider = emailProvider();
  if (provider === 'resend') return sendWithResend(message);
  if (provider === 'smtp') return sendWithSmtp(message);
  // No transport configured: mirror legacy behaviour so the admin UI does not error.
  return { success: true, message: 'Email logged (no provider configured)' };
}

const BASE_STYLE =
  "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333;";

export function generateEmailHtml(template: string, data: Record<string, unknown>): string {
  const userName = (data.userName as string) || 'User';
  const appName = 'LifeOS';
  const templates: Record<string, string> = {
    welcome: `
      <div style="${BASE_STYLE}">
        <h1 style="color: #6366f1;">Welcome to ${appName}!</h1>
        <p>Hi ${userName},</p>
        <p>Welcome to ${appName}! We're excited to have you on board.</p>
        <p>Start organizing your life today with goals, habits, tasks, and more.</p>
        <p>Best regards,<br>The ${appName} Team</p>
      </div>`,
    'password-reset': `
      <div style="${BASE_STYLE}">
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
      </div>`,
    notification: `
      <div style="${BASE_STYLE}">
        <h1 style="color: #6366f1;">${data.title || 'Notification'}</h1>
        <p>Hi ${userName},</p>
        <p>${data.message || ''}</p>
        <p>Best regards,<br>The ${appName} Team</p>
      </div>`,
    custom: `<div style="${BASE_STYLE}">${data.content || ''}</div>`,
  };
  return templates[template] || templates.notification;
}

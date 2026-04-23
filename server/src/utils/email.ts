import nodemailer from "nodemailer";
import { env } from "../config/env";

// Reuse a single transporter per process
let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE === "true",
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

type MailOptions = {
  to: string;
  subject: string;
  html: string;
};

/** Fire-and-forget — never throws, logs failures only. */
export function sendEmail(opts: MailOptions): void {
  if (!env.SMTP_HOST) return; // email not configured — skip silently

  getTransporter()
    .sendMail({ from: env.SMTP_FROM, ...opts })
    .catch((err: unknown) => {
      console.error("[email] send failed:", err);
    });
}

export function sendInvitationEmail(
  to: string,
  workspaceName: string,
  inviterName: string,
  token: string,
  clientUrl: string,
): void {
  const link = `${clientUrl}/invitations/accept/${token}`;
  sendEmail({
    to,
    subject: `You've been invited to join ${workspaceName} on TeamSync`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0b0f0c;padding:32px;border-radius:12px">
        <div style="margin-bottom:24px">
          <span style="background:#22c55e;color:#000;font-size:11px;font-weight:700;padding:4px 10px;border-radius:6px;letter-spacing:0.05em">TEAMSYNC</span>
        </div>
        <h2 style="color:#fff;font-size:20px;margin:0 0 8px">You're invited to ${workspaceName}</h2>
        <p style="color:#94a3b8;font-size:14px;margin:0 0 24px">
          <strong style="color:#e2e8f0">${inviterName}</strong> has invited you to collaborate in the <strong style="color:#e2e8f0">${workspaceName}</strong> workspace.
        </p>
        <a href="${link}"
           style="display:inline-block;background:#22c55e;color:#000;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:24px">
          Accept Invitation →
        </a>
        <p style="color:#475569;font-size:12px;margin:0 0 4px">This invitation expires in 7 days.</p>
        <p style="color:#334155;font-size:11px;margin:0">
          Or copy this link: <a href="${link}" style="color:#22c55e">${link}</a>
        </p>
      </div>
    `,
  });
}

export function sendTaskAssignedEmail(to: string, assigneeName: string, taskTitle: string, projectName: string): void {
  sendEmail({
    to,
    subject: `You've been assigned: ${taskTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#22c55e">New task assigned</h2>
        <p>Hi ${assigneeName},</p>
        <p>You've been assigned a task in <strong>${projectName}</strong>:</p>
        <p style="font-size:1.1em;font-weight:600">${taskTitle}</p>
        <p style="color:#888;font-size:0.85em">Log in to TeamSync to view details and get started.</p>
      </div>
    `,
  });
}

export function sendTaskCompletedEmail(to: string, creatorName: string, taskTitle: string, completedByName: string): void {
  sendEmail({
    to,
    subject: `Task completed: ${taskTitle}`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#22c55e">Task completed ✓</h2>
        <p>Hi ${creatorName},</p>
        <p><strong>${completedByName}</strong> marked this task as done:</p>
        <p style="font-size:1.1em;font-weight:600">${taskTitle}</p>
      </div>
    `,
  });
}

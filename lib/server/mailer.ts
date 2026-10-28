import nodemailer from "nodemailer";

export type MailDelivery = "sent" | "simulated";

async function deliverMail(to: string, subject: string, text: string, simulatedLog: string): Promise<MailDelivery> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !MAIL_FROM) {
    console.info(simulatedLog);
    return "simulated";
  }
  const port = Number(SMTP_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("SMTP_PORT must be a valid port.");
  const transport = nodemailer.createTransport({ host: SMTP_HOST, port, secure: port === 465, auth: { user: SMTP_USER, pass: SMTP_PASS } });
  await transport.sendMail({ from: MAIL_FROM, to, subject, text });
  return "sent";
}

export function sendPasswordReset(to: string, resetUrl: string) {
  return deliverMail(
    to,
    "Reset your MediWay password",
    `Use this link within 30 minutes to reset your MediWay password:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
    `[MediWay simulated password reset] ${to}: ${resetUrl}`,
  );
}

export function sendClinicApproval(to: string, loginEmail: string, resetUrl: string) {
  return deliverMail(
    to,
    "Your MediWay clinic desk is approved",
    `Your MediWay clinic application has been approved.\n\nClinic desk login: ${loginEmail}\nUse the mandatory one-time password setup link below before signing in:\n${resetUrl}\n\nThe link expires in 30 minutes and can be used once.`,
    `[MediWay simulated clinic approval] ${to}: ${loginEmail}; ${resetUrl}`,
  );
}

export function sendDoctorAccess(to: string, loginEmail: string, resetUrl: string) {
  return deliverMail(
    to,
    "Your MediWay doctor portal access",
    `Your doctor portal account is ready.\n\nLogin email: ${loginEmail}\nSet your password using this one-time link within 30 minutes:\n${resetUrl}`,
    `[MediWay simulated doctor access] ${to}: ${loginEmail}; ${resetUrl}`,
  );
}

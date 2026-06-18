const fs = require("fs/promises");
const net = require("net");
const path = require("path");
const tls = require("tls");

function escapeHeader(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

function escapeHtml(value) {
  return escapeHeader(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAddress(email, name) {
  const safeEmail = escapeHeader(email);
  const safeName = escapeHeader(name);
  return safeName ? `"${safeName.replace(/"/g, "'")}" <${safeEmail}>` : safeEmail;
}

function createInvitationEmail(invitation) {
  const appUrl = process.env.APP_URL || "http://localhost:5173";
  const subject = `Invitation: ${invitation.event_name}`;
  const startTime = invitation.start_time ? ` at ${String(invitation.start_time).slice(0, 5)}` : "";
  const venueLine = invitation.venue_name
    ? `${invitation.venue_name}${invitation.venue_city ? `, ${invitation.venue_city}` : ""}`
    : "Venue to be confirmed";
  const invitationCode = invitation.invitation_code || `INV-${invitation.invitation_id}`;

  const text = [
    `Hi ${invitation.guest_name},`,
    "",
    `${invitation.organizer_name} invited you to ${invitation.event_name}.`,
    `Date: ${invitation.event_date}${startTime}`,
    `Venue: ${venueLine}`,
    invitation.dress_code ? `Dress code: ${invitation.dress_code}` : null,
    invitation.agenda ? `Agenda: ${invitation.agenda}` : null,
    "",
    `Invitation code: ${invitationCode}`,
    `Open PopEyez to view details and RSVP: ${appUrl}`,
    "",
    "This invitation also appears in your PopEyez guest workspace.",
  ].filter(Boolean).join("\n");

  const html = [
    `<p>Hi ${escapeHtml(invitation.guest_name)},</p>`,
    `<p>${escapeHtml(invitation.organizer_name)} invited you to <strong>${escapeHtml(invitation.event_name)}</strong>.</p>`,
    "<ul>",
    `<li><strong>Date:</strong> ${escapeHtml(invitation.event_date)}${escapeHtml(startTime)}</li>`,
    `<li><strong>Venue:</strong> ${escapeHtml(venueLine)}</li>`,
    invitation.dress_code ? `<li><strong>Dress code:</strong> ${escapeHtml(invitation.dress_code)}</li>` : "",
    invitation.agenda ? `<li><strong>Agenda:</strong> ${escapeHtml(invitation.agenda)}</li>` : "",
    "</ul>",
    `<p><strong>Invitation code:</strong> ${escapeHtml(invitationCode)}</p>`,
    `<p><a href="${escapeHeader(appUrl)}">Open PopEyez to view details and RSVP</a></p>`,
    "<p>This invitation also appears in your PopEyez guest workspace.</p>",
  ].join("");

  return { subject, text, html };
}

function buildMimeMessage({ from, to, subject, text, html }) {
  const boundary = `popeyez-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  return [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${escapeHeader(subject)}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    text,
    "",
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    "Content-Transfer-Encoding: 7bit",
    "",
    html,
    "",
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

function readResponse(socket) {
  return new Promise((resolve, reject) => {
    let buffer = "";

    function onData(chunk) {
      buffer += chunk.toString("utf8");
      const lines = buffer.split(/\r?\n/).filter(Boolean);
      const lastLine = lines[lines.length - 1];
      if (/^\d{3} /.test(lastLine || "")) {
        cleanup();
        resolve({ code: Number(lastLine.slice(0, 3)), message: buffer });
      }
    }

    function onError(error) {
      cleanup();
      reject(error);
    }

    function cleanup() {
      socket.off("data", onData);
      socket.off("error", onError);
    }

    socket.on("data", onData);
    socket.on("error", onError);
  });
}

async function sendCommand(socket, command, expectedCodes) {
  socket.write(`${command}\r\n`);
  const response = await readResponse(socket);
  if (!expectedCodes.includes(response.code)) {
    throw new Error(`SMTP command failed (${response.code}): ${response.message.trim()}`);
  }
  return response;
}

function connectSmtp({ host, port, secure }) {
  return new Promise((resolve, reject) => {
    const socket = secure
      ? tls.connect({ host, port, servername: host })
      : net.connect({ host, port });

    socket.setTimeout(12000);
    socket.once("error", reject);
    socket.once("timeout", () => {
      socket.destroy();
      reject(new Error("SMTP connection timed out"));
    });
    socket.once(secure ? "secureConnect" : "connect", () => resolve(socket));
  });
}

async function sendWithSmtp({ fromEmail, toEmail, mimeMessage }) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  const socket = await connectSmtp({ host, port, secure });
  try {
    await readResponse(socket);
    await sendCommand(socket, `EHLO ${process.env.SMTP_HELO || "localhost"}`, [250]);

    if (!secure && process.env.SMTP_STARTTLS !== "false") {
      await sendCommand(socket, "STARTTLS", [220]);
      const secureSocket = tls.connect({ socket, servername: host });
      await sendCommand(secureSocket, `EHLO ${process.env.SMTP_HELO || "localhost"}`, [250]);
      return await sendMailCommands(secureSocket, { user, pass, fromEmail, toEmail, mimeMessage });
    }

    return await sendMailCommands(socket, { user, pass, fromEmail, toEmail, mimeMessage });
  } catch (error) {
    socket.destroy();
    throw error;
  }
}

async function sendMailCommands(socket, { user, pass, fromEmail, toEmail, mimeMessage }) {
  if (user && pass) {
    const auth = Buffer.from(`\u0000${user}\u0000${pass}`).toString("base64");
    await sendCommand(socket, `AUTH PLAIN ${auth}`, [235]);
  }

  await sendCommand(socket, `MAIL FROM:<${fromEmail}>`, [250]);
  await sendCommand(socket, `RCPT TO:<${toEmail}>`, [250, 251]);
  await sendCommand(socket, "DATA", [354]);
  socket.write(`${mimeMessage.replace(/\r?\n\./g, "\r\n..")}\r\n.\r\n`);
  const dataResponse = await readResponse(socket);
  if (dataResponse.code !== 250) {
    throw new Error(`SMTP DATA failed (${dataResponse.code}): ${dataResponse.message.trim()}`);
  }
  await sendCommand(socket, "QUIT", [221]);
  return { status: "sent", method: "smtp" };
}

async function saveToOutbox(mimeMessage, toEmail) {
  const outboxDir = path.join(__dirname, "outbox");
  await fs.mkdir(outboxDir, { recursive: true });
  const safeRecipient = String(toEmail).replace(/[^a-z0-9._-]/gi, "_");
  const filename = `${new Date().toISOString().replace(/[:.]/g, "-")}-${safeRecipient}.eml`;
  const filePath = path.join(outboxDir, filename);
  await fs.writeFile(filePath, mimeMessage, "utf8");
  return { status: "saved", method: "outbox", file: filePath };
}

async function sendInvitationEmail(invitation) {
  if (!invitation.guest_email) {
    return { status: "skipped", reason: "Guest has no email address" };
  }

  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "no-reply@popeyez.local";
  const fromName = process.env.SMTP_FROM_NAME || "PopEyez";
  const from = escapeAddress(fromEmail, fromName);
  const to = escapeAddress(invitation.guest_email, invitation.guest_name);
  const email = createInvitationEmail(invitation);
  const mimeMessage = buildMimeMessage({ from, to, ...email });

  if (!process.env.SMTP_HOST) {
    return saveToOutbox(mimeMessage, invitation.guest_email);
  }

  return sendWithSmtp({
    fromEmail,
    toEmail: invitation.guest_email,
    mimeMessage,
  });
}

module.exports = {
  sendInvitationEmail,
};

const express = require('express')
const { Resend } = require('resend')
const nodemailer = require('nodemailer')
const router = express.Router()

const escapeHtml = value =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Uses Resend when RESEND_API_KEY is set (production on Render), otherwise Gmail SMTP via EMAIL_USER/EMAIL_PASS.
function getMailer() {
  if (process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    return {
      from: process.env.RESEND_FROM || 'Soraya Labs Contact <onboarding@resend.dev>',
      async send(message) {
        // Resend does not throw on failure; it returns { data, error }.
        const { error } = await resend.emails.send(message)
        if (error) throw new Error(error.message || 'Resend send failed')
      },
    }
  }

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    })
    return {
      from: `Soraya Labs Contact <${process.env.EMAIL_USER}>`,
      async send(message) {
        await transporter.sendMail(message)
      },
    }
  }

  return null
}

const notificationHtml = ({ name, email, phone, business }) => `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #C9A227, #a07d1a); padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; letter-spacing: 4px; color: #000;">SORAYA LABS</h1>
      <p style="margin: 8px 0 0; color: #000; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">New Appointment Request</p>
    </div>
    <div style="padding: 40px 32px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #1f1f1f; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; width: 140px;">Full Name</td>
          <td style="padding: 14px 0; border-bottom: 1px solid #1f1f1f; color: #fff; font-size: 15px;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #1f1f1f; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Email</td>
          <td style="padding: 14px 0; border-bottom: 1px solid #1f1f1f; color: #fff; font-size: 15px;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 14px 0; border-bottom: 1px solid #1f1f1f; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Phone</td>
          <td style="padding: 14px 0; border-bottom: 1px solid #1f1f1f; color: #fff; font-size: 15px;">${phone}</td>
        </tr>
        <tr>
          <td style="padding: 14px 0; color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; vertical-align: top;">Project Details</td>
          <td style="padding: 14px 0; color: #fff; font-size: 15px; line-height: 1.7; white-space: pre-wrap;">${business}</td>
        </tr>
      </table>
    </div>
    <div style="background: #111; padding: 20px 32px; text-align: center; border-top: 1px solid #1f1f1f;">
      <p style="margin: 0; color: #555; font-size: 12px; letter-spacing: 1px;">© 2026 Soraya Labs — Canada</p>
    </div>
  </div>
`

const autoReplyHtml = ({ name }) => `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0a0a0a; color: #ffffff; border-radius: 12px; overflow: hidden;">
    <div style="background: linear-gradient(135deg, #C9A227, #a07d1a); padding: 32px; text-align: center;">
      <h1 style="margin: 0; font-size: 28px; letter-spacing: 4px; color: #000;">SORAYA LABS</h1>
      <p style="margin: 8px 0 0; color: #000; font-size: 13px; letter-spacing: 2px; text-transform: uppercase;">Thank You</p>
    </div>
    <div style="padding: 40px 32px;">
      <p style="color: #fff; font-size: 16px; line-height: 1.7; margin: 0 0 20px;">Hi ${name},</p>
      <p style="color: #ccc; font-size: 15px; line-height: 1.8; margin: 0 0 20px;">
        Thank you for contacting us. We have received your inquiry and will reach out within <strong style="color: #C9A227;">24 hours</strong>.
      </p>
      <p style="color: #888; font-size: 14px; line-height: 1.7; margin: 0;">
        If your request is urgent, feel free to reply to this email or message us on WhatsApp.
      </p>
    </div>
    <div style="background: #111; padding: 20px 32px; text-align: center; border-top: 1px solid #1f1f1f;">
      <p style="margin: 0; color: #555; font-size: 12px;">© 2026 Soraya Labs — Canada</p>
    </div>
  </div>
`

router.post('/', async (req, res) => {
  const { name, email, phone, business } = req.body || {}

  if (!name || !email || !phone || !business) {
    return res.status(400).json({ message: 'All fields are required.' })
  }
  if (!EMAIL_RE.test(String(email).trim())) {
    return res.status(400).json({ message: 'Please enter a valid email address.' })
  }

  const mailer = getMailer()
  if (!mailer) {
    console.error('Mail error: no mail provider configured (set RESEND_API_KEY or EMAIL_USER/EMAIL_PASS)')
    return res.status(500).json({ message: 'Failed to send message. Please try again.' })
  }

  const notifyTo = process.env.CONTACT_NOTIFY_EMAIL || 'jayadirections@gmail.com'
  const visitorEmail = String(email).trim()
  const safe = {
    name: escapeHtml(name),
    email: escapeHtml(visitorEmail),
    phone: escapeHtml(phone),
    business: escapeHtml(business),
  }
  const subjectName = String(name).replace(/[\r\n]+/g, ' ').slice(0, 100)

  try {
    await mailer.send({
      from: mailer.from,
      to: notifyTo,
      replyTo: visitorEmail,
      subject: `New Appointment Request — ${subjectName}`,
      html: notificationHtml(safe),
    })
  } catch (err) {
    console.error('Mail error:', err.message)
    return res.status(500).json({ message: 'Failed to send message. Please try again.' })
  }

  try {
    await mailer.send({
      from: mailer.from,
      to: visitorEmail,
      subject: 'Thank you for contacting Soraya Labs',
      html: autoReplyHtml(safe),
    })
  } catch (autoReplyErr) {
    console.error('Auto-reply email error:', autoReplyErr.message)
  }

  res.status(200).json({
    message: 'Thank you for contacting us. We will reach out within 24 hours.',
  })
})

module.exports = router

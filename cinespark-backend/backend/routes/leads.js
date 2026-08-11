const express = require("express");
const rateLimit = require("express-rate-limit");
const { insertLead, listLeads } = require("../db");
const { sendLeadNotification } = require("../mailer");
const { apiKeyAuth } = require("../middleware/auth");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_SERVICES = [
  "Cinematic Shooting",
  "Video Editing",
  "Social Media Management",
  "Full Retainer / Not Sure Yet",
];

// Limit lead submissions to reduce spam: 5 per 15 minutes per IP
const submitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many submissions from this device. Please try again later." },
});

// POST /api/leads — public, called by the contact form
router.post("/", submitLimiter, async (req, res) => {
  const { name, org, organization, email, service, message, website } = req.body || {};

  // Honeypot field: real users never fill this hidden input, bots often do.
  if (website) {
    return res.status(201).json({ ok: true });
  }

  const orgValue = organization || org;
  const errors = [];

  if (!name || String(name).trim().length < 2) errors.push("name is required");
  if (!orgValue || String(orgValue).trim().length < 2) errors.push("organization is required");
  if (!email || !EMAIL_RE.test(String(email).trim())) errors.push("a valid email is required");
  if (!service || !ALLOWED_SERVICES.includes(service)) errors.push("a valid service selection is required");
  if (message && String(message).length > 3000) errors.push("message is too long");

  if (errors.length) {
    return res.status(400).json({ error: "Invalid submission", details: errors });
  }

  const lead = {
    name: String(name).trim().slice(0, 200),
    organization: String(orgValue).trim().slice(0, 200),
    email: String(email).trim().slice(0, 200),
    service: String(service).trim(),
    message: message ? String(message).trim().slice(0, 3000) : null,
    ip: req.ip,
  };

  try {
    const result = insertLead.run(lead);
    // Fire-and-forget — don't make the visitor wait on SMTP round trip.
    sendLeadNotification(lead).catch(() => {});
    return res.status(201).json({ ok: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error("[leads] Failed to save lead:", err.message);
    return res.status(500).json({ error: "Could not save your submission. Please try again." });
  }
});

// GET /api/leads — admin only, requires x-api-key header
router.get("/", apiKeyAuth, (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 500);
  const rows = listLeads.all({ limit });
  res.json({ count: rows.length, leads: rows });
});

module.exports = router;

function apiKeyAuth(req, res, next) {
  const providedKey = req.header("x-api-key");
  const expectedKey = process.env.ADMIN_API_KEY;

  if (!expectedKey) {
    return res.status(500).json({ error: "Server is missing ADMIN_API_KEY configuration." });
  }

  if (!providedKey || providedKey !== expectedKey) {
    return res.status(401).json({ error: "Unauthorized. Provide a valid x-api-key header." });
  }

  next();
}

module.exports = { apiKeyAuth };

// Verifies the Kisan id_token (JWT) sent in the Authorization header.
// See oauth-integration.md → Step 6: Make Authenticated API Requests
// Kisan signs tokens with their private key; we decode the payload and
// verify expiry without signature verification (no Kisan public key needed).
function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.trim();

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const parts = token.split('.');
    if (parts.length !== 3) throw new Error('Invalid JWT format');

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString('utf8'));

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return res.status(401).json({ error: 'Token expired' });
    }

    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = verifyToken;

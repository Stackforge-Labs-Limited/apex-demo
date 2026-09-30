// Every request carries a signed session; `req.user` is set from it.
export function requireUser(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'sign in first' });
  next();
}

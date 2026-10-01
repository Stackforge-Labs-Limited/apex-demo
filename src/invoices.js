import { Router } from 'express';
import { db } from './db.js';
import { requireUser } from './auth.js';

export const invoices = Router();

// The signed-in user's own invoices.
invoices.get('/invoices', requireUser, (req, res) => {
  const rows = db
    .prepare('SELECT * FROM invoices WHERE owner_id = ? ORDER BY id DESC')
    .all(req.user.id);
  res.json(rows);
});

// Search the signed-in user's invoices by customer name,
// e.g. /invoices/search?customer=acme
invoices.get('/invoices/search', requireUser, (req, res) => {
  const customer = String(req.query.customer ?? '');
  const rows = db
    .prepare('SELECT * FROM invoices WHERE owner_id = ? AND customer LIKE ? ORDER BY id DESC LIMIT 100')
    .all(req.user.id, `%${customer}%`);
  res.json(rows);
});

// One of the signed-in user's invoices, for the detail page. Someone else's
// answers 404, so an id never confirms that an invoice exists.
invoices.get('/invoices/:id', requireUser, (req, res) => {
  const row = db
    .prepare('SELECT * FROM invoices WHERE id = ? AND owner_id = ?')
    .get(req.params.id, req.user.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

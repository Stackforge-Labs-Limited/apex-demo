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

// Search invoices by customer name, e.g. /invoices/search?customer=acme
invoices.get('/invoices/search', requireUser, (req, res) => {
  const customer = req.query.customer ?? '';
  const rows = db
    .prepare(`SELECT * FROM invoices WHERE customer LIKE '%${customer}%'`)
    .all();
  res.json(rows);
});

// One invoice, for the detail page.
invoices.get('/invoices/:id', requireUser, (req, res) => {
  const row = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'not found' });
  res.json(row);
});

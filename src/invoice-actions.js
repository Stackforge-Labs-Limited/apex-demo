import { Router } from 'express';
import { db } from './db.js';
import { requireUser } from './auth.js';

export const invoiceActions = Router();

// Someone else's invoice answers 404, not 403: a 403 would confirm that the
// id exists, which lets anyone count our customers' invoices.
function ownInvoice(req, res) {
  const row = db
    .prepare('SELECT * FROM invoices WHERE id = ? AND owner_id = ?')
    .get(req.params.id, req.user.id);
  if (!row) res.status(404).json({ error: 'not found' });
  return row;
}

// Totals for the dashboard. Cached per user for 60 seconds: the dashboard
// polls every few seconds, and a total that lags by up to a minute after a
// payment is fine for a summary tile.
const summaryCache = new Map();

invoiceActions.get('/invoices/summary', requireUser, (req, res) => {
  const hit = summaryCache.get(req.user.id);
  if (hit && Date.now() - hit.at < 60_000) return res.json(hit.value);
  const value = db
    .prepare(
      `SELECT status, COUNT(*) AS count, SUM(amount_cents) AS total_cents
         FROM invoices WHERE owner_id = ? GROUP BY status`,
    )
    .all(req.user.id);
  summaryCache.set(req.user.id, { at: Date.now(), value });
  res.json(value);
});

invoiceActions.post('/invoices/:id/pay', requireUser, (req, res) => {
  const row = ownInvoice(req, res);
  if (!row) return;
  if (row.status === 'paid') return res.json(row);
  db.prepare("UPDATE invoices SET status = 'paid' WHERE id = ?").run(row.id);
  res.json({ ...row, status: 'paid' });
});

// Open invoices can be deleted outright. Paid ones cannot: they are records
// of money received. We keep no deleted rows, since a draft that was never
// sent is not worth an audit trail.
invoiceActions.delete('/invoices/:id', requireUser, (req, res) => {
  const row = ownInvoice(req, res);
  if (!row) return;
  if (row.status === 'paid') {
    return res.status(409).json({ error: 'paid invoices cannot be deleted' });
  }
  db.prepare('DELETE FROM invoices WHERE id = ?').run(row.id);
  res.status(204).end();
});

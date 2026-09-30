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

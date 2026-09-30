import express from 'express';
import { invoices } from './invoices.js';

const app = express();
app.use(express.json());
app.use('/api', invoices);

app.listen(process.env.PORT ?? 3000);

import express from 'express';
import { AppDataSource } from './data-source.js';

const app = express();
app.use(express.json());

app.get('/api/status', async (_req, res) => {
    await AppDataSource.query('SELECT 1');
    res.json({ status: 'OK', database: 'OK' });
});

export default app;

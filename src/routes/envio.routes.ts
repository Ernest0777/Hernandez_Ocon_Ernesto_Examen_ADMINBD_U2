import { Router } from 'express';
import { postEnvio } from '../controllers/envio.controller.js';

const router = Router();
router.post('/envios', postEnvio);

export default router;

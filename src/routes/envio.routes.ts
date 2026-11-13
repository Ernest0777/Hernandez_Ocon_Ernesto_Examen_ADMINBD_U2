import { Router } from 'express';
import {
    getEnvios,
    getEnviosCliente,
    manejarErrorEnvios,
    postEnvio,
    postPaquete,
    postRastreo,
    putCosto,
} from '../controllers/envio.controller.js';

const router = Router();
router.post('/envios', postEnvio);
router.put('/envios/:id/costo', putCosto);
router.post('/almacenes/:id/paquetes', postPaquete);
router.post('/envios/:id/rastreo', postRastreo);
router.get('/envios', getEnvios);
router.get('/clientes/:id/envios', getEnviosCliente);
router.use(manejarErrorEnvios);

export default router;

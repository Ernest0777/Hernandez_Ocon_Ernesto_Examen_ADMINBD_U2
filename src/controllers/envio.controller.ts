import type { Request, Response } from 'express';
import { crearEnvio, DatosEnvioInvalidos } from '../services/envio.service.js';

export async function postEnvio(req: Request, res: Response) {
    try {
        const envio = await crearEnvio(req.body);
        return res.status(201).json({ data: envio });
    } catch (error) {
        if (error instanceof DatosEnvioInvalidos) {
            return res.status(400).json({ message: error.message });
        }
        throw error;
    }
}

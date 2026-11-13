import type { ErrorRequestHandler, Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import {
    actualizarCosto,
    crearEnvio,
    DatosEnvioInvalidos,
    idRuta,
    listarEnviosActivos,
    listarEnviosCliente,
    registrarPaquete,
    registrarRastreo,
    RegistroNoEncontrado,
} from '../services/envio.service.js';

export async function postEnvio(req: Request, res: Response) {
    const envio = await crearEnvio(req.body);
    return res.status(201).json({ data: envio });
}

export async function putCosto(req: Request, res: Response) {
    const envio = await actualizarCosto(idRuta(req.params.id), req.body);
    return res.json({ data: envio });
}

export async function postPaquete(req: Request, res: Response) {
    const paquete = await registrarPaquete(idRuta(req.params.id), req.body);
    return res.status(201).json({ data: paquete });
}

export async function postRastreo(req: Request, res: Response) {
    const rastreo = await registrarRastreo(idRuta(req.params.id), req.body);
    return res.status(201).json({ data: rastreo });
}

export async function getEnvios(_req: Request, res: Response) {
    const envios = await listarEnviosActivos();
    return res.json({ data: envios });
}

export async function getEnviosCliente(req: Request, res: Response) {
    const envios = await listarEnviosCliente(idRuta(req.params.id));
    return res.json({ data: envios });
}

export const manejarErrorEnvios: ErrorRequestHandler = (error, _req, res, next) => {
    if (error instanceof DatosEnvioInvalidos) {
        res.status(400).json({ message: error.message });
        return;
    }
    if (error instanceof RegistroNoEncontrado) {
        res.status(404).json({ message: error.message });
        return;
    }
    if (error instanceof QueryFailedError) {
        const driver = error.driverError as { code?: string; sqlState?: string; sqlMessage?: string };
        if (driver.sqlState === '45000') {
            res.status(400).json({ message: driver.sqlMessage ?? 'MySQL rechazo la operacion' });
            return;
        }
        if (driver.code === 'ER_NO_REFERENCED_ROW_2') {
            res.status(400).json({ message: 'El envio, la direccion o el almacen indicado no existe' });
            return;
        }
    }
    next(error);
};

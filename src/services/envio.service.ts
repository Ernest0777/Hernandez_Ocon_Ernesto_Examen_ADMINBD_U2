import { QueryFailedError } from 'typeorm';
import { AppDataSource } from '../data-source.js';
import { Envio } from '../entities/Envio.js';
import { Paquete } from '../entities/Paquete.js';

export class DatosEnvioInvalidos extends Error {}

function objeto(valor: unknown): Record<string, unknown> {
    if (valor === null || typeof valor !== 'object' || Array.isArray(valor)) {
        throw new DatosEnvioInvalidos('Se esperaba un objeto JSON');
    }
    return valor as Record<string, unknown>;
}

function id(valor: unknown, campo: string): number {
    if (typeof valor !== 'number' || !Number.isInteger(valor) || valor < 1 || valor > 4294967295) {
        throw new DatosEnvioInvalidos(campo + ' debe ser un entero positivo');
    }
    return valor;
}

function decimal(valor: unknown, campo: string, maxDigitosEnteros: number, minimo: number): string {
    if (typeof valor !== 'number' && typeof valor !== 'string') {
        throw new DatosEnvioInvalidos(campo + ' tiene un importe o medida invalida');
    }

    const texto = String(valor);
    const [parteEntera] = texto.split('.');
    const numero = Number(texto);

    if (!/^\d+(\.\d{1,2})?$/.test(texto) || parteEntera.length > maxDigitosEnteros || numero < minimo) {
        throw new DatosEnvioInvalidos(campo + ' tiene un importe o medida invalida');
    }
    return numero.toFixed(2);
}

export async function crearEnvio(body: unknown) {
    const datos = objeto(body);
    const envio = {
        direccionOrigenId: id(datos.direccionOrigenId, 'direccionOrigenId'),
        direccionDestinoId: id(datos.direccionDestinoId, 'direccionDestinoId'),
        costoTotal: decimal(datos.costoTotal, 'costoTotal', 10, 0),
    };
    if (!Array.isArray(datos.paquetes) || datos.paquetes.length === 0) {
        throw new DatosEnvioInvalidos('Agrega al menos un paquete');
    }
    const paquetes = datos.paquetes.map((valor: unknown) => {
        const paquete = objeto(valor);
        if (typeof paquete.contenido !== 'string' || !paquete.contenido.trim() ||
            paquete.contenido.trim().length > 255) {
            throw new DatosEnvioInvalidos('contenido debe tener entre 1 y 255 caracteres');
        }
        return {
            peso: decimal(paquete.peso, 'peso', 6, 0.01),
            largo: decimal(paquete.largo, 'largo', 6, 0.01),
            ancho: decimal(paquete.ancho, 'ancho', 6, 0.01),
            alto: decimal(paquete.alto, 'alto', 6, 0.01),
            contenido: paquete.contenido.trim(),
            almacenId: paquete.almacenId == null ? null : id(paquete.almacenId, 'almacenId'),
        };
    });

    try {
        return await AppDataSource.transaction(async (manager) => {
            const registro = await manager.save(Envio, envio);
            const guardados = await manager.save(Paquete, paquetes.map(paquete => ({
                ...paquete,
                envioId: registro.envioId,
            })));
            return { ...registro, paquetes: guardados };
        });
    } catch (error) {
        if (error instanceof QueryFailedError) {
            const driver = error.driverError as { code?: string; sqlState?: string; sqlMessage?: string };
            if (driver.sqlState === '45000') {
                throw new DatosEnvioInvalidos(driver.sqlMessage ?? 'MySQL rechazo el envio');
            }
            if (driver.code === 'ER_NO_REFERENCED_ROW_2') {
                throw new DatosEnvioInvalidos('La direccion o el almacen indicado no existe');
            }
        }
        throw error;
    }
}

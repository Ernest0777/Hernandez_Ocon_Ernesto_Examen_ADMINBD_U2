import { AppDataSource } from '../data-source.js';
import { Cliente } from '../entities/Cliente.js';
import { Envio } from '../entities/Envio.js';
import { HistorialRastreo } from '../entities/HistorialRastreo.js';
import { Paquete } from '../entities/Paquete.js';

export class DatosEnvioInvalidos extends Error {}
export class RegistroNoEncontrado extends Error {}

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

export function idRuta(valor: unknown): number {
    if (typeof valor !== 'string' || !/^\d+$/.test(valor)) {
        throw new DatosEnvioInvalidos('El ID debe ser un entero positivo');
    }
    return id(Number(valor), 'El ID');
}

function datosPaquete(paquete: Record<string, unknown>) {
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
    };
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
        return {
            ...datosPaquete(paquete),
            almacenId: paquete.almacenId == null ? null : id(paquete.almacenId, 'almacenId'),
        };
    });

    return AppDataSource.transaction(async (manager) => {
        const registro = await manager.save(Envio, envio);
        const guardados = await manager.save(Paquete, paquetes.map(paquete => ({
            ...paquete,
            envioId: registro.envioId,
        })));
        return { ...registro, paquetes: guardados };
    });
}

export async function actualizarCosto(envioId: number, body: unknown) {
    const costoTotal = decimal(objeto(body).costoTotal, 'costoTotal', 10, 0);

    return AppDataSource.transaction(async (manager) => {
        await manager.update(Envio, { envioId }, { costoTotal });
        const envio = await manager.findOneBy(Envio, { envioId });
        if (!envio) {
            throw new RegistroNoEncontrado('El envio no existe');
        }
        return envio;
    });
}

export async function registrarPaquete(almacenId: number, body: unknown) {
    const datos = objeto(body);
    return AppDataSource.getRepository(Paquete).save({
        ...datosPaquete(datos),
        envioId: id(datos.envioId, 'envioId'),
        almacenId,
    });
}

export async function registrarRastreo(envioId: number, body: unknown) {
    const { ubicacionActual, estadoEvento, observaciones = null } = objeto(body);

    if (typeof ubicacionActual !== 'string' || !ubicacionActual.trim() || ubicacionActual.trim().length > 180) {
        throw new DatosEnvioInvalidos('ubicacionActual debe tener entre 1 y 180 caracteres');
    }
    if (estadoEvento !== 'REGISTRADO' && estadoEvento !== 'EN_TRANSITO' &&
        estadoEvento !== 'ENTREGADO' && estadoEvento !== 'CANCELADO') {
        throw new DatosEnvioInvalidos('estadoEvento no es valido');
    }
    if (observaciones !== null && (typeof observaciones !== 'string' || observaciones.length > 255)) {
        throw new DatosEnvioInvalidos('observaciones debe tener hasta 255 caracteres');
    }

    return AppDataSource.getRepository(HistorialRastreo).save({
        envioId,
        ubicacionActual: ubicacionActual.trim(),
        estadoEvento,
        observaciones,
    });
}

function consultarEnvios() {
    return AppDataSource.getRepository(Envio).createQueryBuilder('envio')
        .innerJoinAndSelect('envio.direccionOrigen', 'origen')
        .innerJoinAndSelect('origen.cliente', 'remitente')
        .innerJoinAndSelect('envio.direccionDestino', 'destino')
        .innerJoinAndSelect('destino.cliente', 'destinatario')
        .leftJoinAndSelect('envio.paquetes', 'paquete')
        .orderBy('envio.fecha', 'DESC')
        .addOrderBy('envio.envioId', 'DESC');
}

export function listarEnviosActivos() {
    return consultarEnvios()
        .where('envio.estado IN (:...estados)', { estados: ['REGISTRADO', 'EN_TRANSITO'] })
        .getMany();
}

export async function listarEnviosCliente(clienteId: number) {
    if (!await AppDataSource.getRepository(Cliente).existsBy({ clienteId })) {
        throw new RegistroNoEncontrado('El cliente no existe');
    }
    return consultarEnvios()
        .where('origen.clienteId = :clienteId OR destino.clienteId = :clienteId', { clienteId })
        .getMany();
}

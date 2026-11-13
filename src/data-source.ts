import 'dotenv/config';
import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Cliente } from './entities/Cliente.js';
import { Direccion } from './entities/Direccion.js';
import { Envio } from './entities/Envio.js';
import { Paquete } from './entities/Paquete.js';
import { Almacen } from './entities/Almacen.js';
import { HistorialRastreo } from './entities/HistorialRastreo.js';
import { AuditoriaEnvio } from './entities/AuditoriaEnvio.js';

export const AppDataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3307),
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'logiexpress',
    charset: 'utf8mb4',
    synchronize: false,
    entities: [Cliente, Direccion, Envio, Paquete, Almacen, HistorialRastreo, AuditoriaEnvio],
});

import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { Direccion } from './Direccion.js';

@Entity('clientes')
export class Cliente {
    @PrimaryGeneratedColumn({ name: 'cliente_id', unsigned: true })
    clienteId!: number;

    @Column({ type: 'varchar', length: 120 })
    nombre!: string;

    @Column({ type: 'enum', enum: ['ACTIVO', 'INACTIVO'], default: 'ACTIVO' })
    estado!: 'ACTIVO' | 'INACTIVO';

    @Column({ type: 'decimal', name: 'limite_credito', precision: 12, scale: 2, default: 0 })
    limiteCredito!: string;

    @OneToMany(() => Direccion, (registro) => registro.cliente)
    direcciones!: Relation<Direccion[]>;
}

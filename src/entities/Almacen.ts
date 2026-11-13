import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { Paquete } from './Paquete.js';

@Entity('almacenes')
export class Almacen {
    @PrimaryGeneratedColumn({ name: 'almacen_id', unsigned: true })
    almacenId!: number;

    @Column({ type: 'varchar', length: 120 })
    nombre!: string;

    @Column({ type: 'varchar', length: 180 })
    ubicacion!: string;

    @Column({ type: 'int', name: 'capacidad_maxima', unsigned: true })
    capacidadMaxima!: number;

    @OneToMany(() => Paquete, (registro) => registro.almacen)
    paquetes!: Relation<Paquete[]>;
}

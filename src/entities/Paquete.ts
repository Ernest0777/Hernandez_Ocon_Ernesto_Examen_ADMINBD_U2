import { Column, Entity, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { Envio } from './Envio.js';
import { Almacen } from './Almacen.js';

@Entity('paquetes')
export class Paquete {
    @PrimaryGeneratedColumn({ name: 'paquete_id', unsigned: true })
    paqueteId!: number;

    @Column({ type: 'decimal', precision: 8, scale: 2 })
    peso!: string;

    @Column({ type: 'decimal', precision: 8, scale: 2 })
    largo!: string;

    @Column({ type: 'decimal', precision: 8, scale: 2 })
    ancho!: string;

    @Column({ type: 'decimal', precision: 8, scale: 2 })
    alto!: string;

    @Column({ type: 'varchar', length: 255 })
    contenido!: string;

    @Column({ name: 'envio_id', type: 'int', unsigned: true, nullable: false })
    envioId!: number;

    @ManyToOne(() => Envio, (envio) => envio.paquetes, { nullable: false })
    @JoinColumn({ name: 'envio_id' })
    envio!: Relation<Envio>;

    @Column({ name: 'almacen_id', type: 'int', unsigned: true, nullable: true })
    almacenId!: number | null;

    @ManyToOne(() => Almacen, (almacen) => almacen.paquetes, { nullable: true })
    @JoinColumn({ name: 'almacen_id' })
    almacen!: Relation<Almacen | null>;
}

import { Column, Entity, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { Envio } from './Envio.js';

@Entity('historial_rastreo')
export class HistorialRastreo {
    @PrimaryGeneratedColumn({ name: 'rastreo_id', unsigned: true })
    rastreoId!: number;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    fecha!: Date;

    @Column({ type: 'varchar', name: 'ubicacion_actual', length: 180 })
    ubicacionActual!: string;

    @Column({ type: 'enum', name: 'estado_evento', enum: ['REGISTRADO', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO'] })
    estadoEvento!: 'REGISTRADO' | 'EN_TRANSITO' | 'ENTREGADO' | 'CANCELADO';

    @Column({ type: 'varchar', length: 255, nullable: true })
    observaciones!: string | null;

    @Column({ name: 'envio_id', type: 'int', unsigned: true, nullable: false })
    envioId!: number;

    @ManyToOne(() => Envio, (envio) => envio.historial, { nullable: false })
    @JoinColumn({ name: 'envio_id' })
    envio!: Relation<Envio>;
}

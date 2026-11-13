import { Column, Entity, PrimaryGeneratedColumn, JoinColumn, ManyToOne } from 'typeorm';
import type { Relation } from 'typeorm';
import { Envio } from './Envio.js';

@Entity('auditoria_envios')
export class AuditoriaEnvio {
    @PrimaryGeneratedColumn({ name: 'auditoria_id', unsigned: true })
    auditoriaId!: number;

    @Column({ type: 'decimal', name: 'costo_anterior', precision: 12, scale: 2 })
    costoAnterior!: string;

    @Column({ type: 'decimal', name: 'costo_nuevo', precision: 12, scale: 2 })
    costoNuevo!: string;

    @Column({ type: 'varchar', length: 288 })
    usuario!: string;

    @Column({ type: 'datetime', name: 'fecha_modificacion', default: () => 'CURRENT_TIMESTAMP' })
    fechaModificacion!: Date;

    @Column({ name: 'envio_id', type: 'int', unsigned: true, nullable: false })
    envioId!: number;

    @ManyToOne(() => Envio, (envio) => envio.auditorias, { nullable: false })
    @JoinColumn({ name: 'envio_id' })
    envio!: Relation<Envio>;
}

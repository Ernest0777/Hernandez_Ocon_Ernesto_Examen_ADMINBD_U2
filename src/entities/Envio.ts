import { Column, Entity, PrimaryGeneratedColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { Direccion } from './Direccion.js';
import { Paquete } from './Paquete.js';
import { HistorialRastreo } from './HistorialRastreo.js';
import { AuditoriaEnvio } from './AuditoriaEnvio.js';

@Entity('envios')
export class Envio {
    @PrimaryGeneratedColumn({ name: 'envio_id', unsigned: true })
    envioId!: number;

    @Column({ type: 'decimal', name: 'costo_total', precision: 12, scale: 2 })
    costoTotal!: string;

    @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
    fecha!: Date;

    @Column({ type: 'enum', enum: ['REGISTRADO', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO'], default: 'REGISTRADO' })
    estado!: 'REGISTRADO' | 'EN_TRANSITO' | 'ENTREGADO' | 'CANCELADO';

    @Column({ name: 'direccion_origen_id', type: 'int', unsigned: true, nullable: false })
    direccionOrigenId!: number;

    @ManyToOne(() => Direccion, (direccionOrigen) => direccionOrigen.enviosOrigen, { nullable: false })
    @JoinColumn({ name: 'direccion_origen_id' })
    direccionOrigen!: Relation<Direccion>;

    @Column({ name: 'direccion_destino_id', type: 'int', unsigned: true, nullable: false })
    direccionDestinoId!: number;

    @ManyToOne(() => Direccion, (direccionDestino) => direccionDestino.enviosDestino, { nullable: false })
    @JoinColumn({ name: 'direccion_destino_id' })
    direccionDestino!: Relation<Direccion>;

    @OneToMany(() => Paquete, (registro) => registro.envio)
    paquetes!: Relation<Paquete[]>;

    @OneToMany(() => HistorialRastreo, (registro) => registro.envio)
    historial!: Relation<HistorialRastreo[]>;

    @OneToMany(() => AuditoriaEnvio, (registro) => registro.envio)
    auditorias!: Relation<AuditoriaEnvio[]>;
}

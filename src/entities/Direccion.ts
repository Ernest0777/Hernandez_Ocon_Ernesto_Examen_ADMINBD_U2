import { Column, Entity, PrimaryGeneratedColumn, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { Cliente } from './Cliente.js';
import { Envio } from './Envio.js';

@Entity('direcciones')
export class Direccion {
    @PrimaryGeneratedColumn({ name: 'direccion_id', unsigned: true })
    direccionId!: number;

    @Column({ type: 'varchar', length: 180 })
    calle!: string;

    @Column({ type: 'varchar', length: 100 })
    ciudad!: string;

    @Column({ type: 'varchar', name: 'codigo_postal', length: 12 })
    codigoPostal!: string;

    @Column({ name: 'cliente_id', type: 'int', unsigned: true, nullable: false })
    clienteId!: number;

    @ManyToOne(() => Cliente, (cliente) => cliente.direcciones, { nullable: false })
    @JoinColumn({ name: 'cliente_id' })
    cliente!: Relation<Cliente>;

    @OneToMany(() => Envio, (registro) => registro.direccionOrigen)
    enviosOrigen!: Relation<Envio[]>;

    @OneToMany(() => Envio, (registro) => registro.direccionDestino)
    enviosDestino!: Relation<Envio[]>;
}

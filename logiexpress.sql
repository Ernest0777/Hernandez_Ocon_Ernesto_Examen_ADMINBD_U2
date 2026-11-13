CREATE DATABASE IF NOT EXISTS logiexpress CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE logiexpress;

CREATE TABLE IF NOT EXISTS clientes (
    cliente_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    estado ENUM('ACTIVO', 'INACTIVO') NOT NULL DEFAULT 'ACTIVO',
    limite_credito DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (limite_credito >= 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS direcciones (
    direccion_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT UNSIGNED NOT NULL,
    calle VARCHAR(180) NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    codigo_postal VARCHAR(12) NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(cliente_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS almacenes (
    almacen_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    ubicacion VARCHAR(180) NOT NULL,
    capacidad_maxima INT UNSIGNED NOT NULL CHECK (capacidad_maxima > 0)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS envios (
    envio_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    direccion_origen_id INT UNSIGNED NOT NULL,
    direccion_destino_id INT UNSIGNED NOT NULL,
    costo_total DECIMAL(12,2) NOT NULL CHECK (costo_total >= 0),
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('REGISTRADO', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO') NOT NULL DEFAULT 'REGISTRADO',
    FOREIGN KEY (direccion_origen_id) REFERENCES direcciones(direccion_id),
    FOREIGN KEY (direccion_destino_id) REFERENCES direcciones(direccion_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS paquetes (
    paquete_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    envio_id INT UNSIGNED NOT NULL,
    almacen_id INT UNSIGNED NULL,
    peso DECIMAL(8,2) NOT NULL CHECK (peso > 0),
    largo DECIMAL(8,2) NOT NULL CHECK (largo > 0),
    ancho DECIMAL(8,2) NOT NULL CHECK (ancho > 0),
    alto DECIMAL(8,2) NOT NULL CHECK (alto > 0),
    contenido VARCHAR(255) NOT NULL,
    FOREIGN KEY (envio_id) REFERENCES envios(envio_id),
    FOREIGN KEY (almacen_id) REFERENCES almacenes(almacen_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS historial_rastreo (
    rastreo_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    envio_id INT UNSIGNED NOT NULL,
    fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ubicacion_actual VARCHAR(180) NOT NULL,
    estado_evento ENUM('REGISTRADO', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO') NOT NULL,
    observaciones VARCHAR(255),
    INDEX idx_rastreo_envio_fecha (envio_id, fecha, rastreo_id),
    FOREIGN KEY (envio_id) REFERENCES envios(envio_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auditoria_envios (
    auditoria_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    envio_id INT UNSIGNED NOT NULL,
    costo_anterior DECIMAL(12,2) NOT NULL,
    costo_nuevo DECIMAL(12,2) NOT NULL,
    usuario VARCHAR(288) NOT NULL,
    fecha_modificacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (envio_id) REFERENCES envios(envio_id)
) ENGINE=InnoDB;

DROP PROCEDURE IF EXISTS sp_reporte_mensual_cliente;
DROP PROCEDURE IF EXISTS sp_obtener_hoja_ruta_envio;
DROP TRIGGER IF EXISTS before_insert_paquete_almacen;
DROP TRIGGER IF EXISTS after_update_envio_costo;
DROP TRIGGER IF EXISTS after_insert_historial_rastreo;

DELIMITER $$

CREATE PROCEDURE sp_reporte_mensual_cliente(
    IN p_cliente_id INT UNSIGNED, IN p_mes INT, IN p_anio INT
)
BEGIN
    DECLARE inicio DATE;
    IF p_mes IS NULL OR p_mes NOT BETWEEN 1 AND 12
        OR p_anio IS NULL OR p_anio NOT BETWEEN 1000 AND 9998 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mes o anio invalido';
    END IF;

    SET inicio = DATE_ADD(MAKEDATE(p_anio, 1), INTERVAL (p_mes - 1) MONTH);

    SELECT COALESCE(SUM(CASE WHEN e.estado <> 'CANCELADO' THEN e.costo_total END), 0)
               AS facturacion_total,
           COUNT(CASE WHEN e.estado = 'ENTREGADO' THEN 1 END) AS envios_entregados,
           ROUND(AVG(CASE WHEN e.estado = 'ENTREGADO'
               THEN TIMESTAMPDIFF(SECOND, e.fecha, entrega.fecha_entrega) / 3600 END), 2)
               AS promedio_entrega_horas
    FROM envios e
    JOIN direcciones origen ON origen.direccion_id = e.direccion_origen_id
    LEFT JOIN (
        SELECT envio_id, MIN(fecha) AS fecha_entrega
        FROM historial_rastreo
        WHERE estado_evento = 'ENTREGADO'
        GROUP BY envio_id
    ) entrega ON entrega.envio_id = e.envio_id
    WHERE origen.cliente_id = p_cliente_id
      AND e.fecha >= inicio AND e.fecha < DATE_ADD(inicio, INTERVAL 1 MONTH);
END$$

CREATE PROCEDURE sp_obtener_hoja_ruta_envio(IN p_envio_id INT UNSIGNED)
BEGIN
    SELECT e.*, remitente.cliente_id AS remitente_id, remitente.nombre AS remitente,
           origen.calle AS calle_origen, origen.ciudad AS ciudad_origen,
           origen.codigo_postal AS codigo_postal_origen,
           destinatario.cliente_id AS destinatario_id, destinatario.nombre AS destinatario,
           destino.calle AS calle_destino, destino.ciudad AS ciudad_destino,
           destino.codigo_postal AS codigo_postal_destino
    FROM envios e
    JOIN direcciones origen ON origen.direccion_id = e.direccion_origen_id
    JOIN clientes remitente ON remitente.cliente_id = origen.cliente_id
    JOIN direcciones destino ON destino.direccion_id = e.direccion_destino_id
    JOIN clientes destinatario ON destinatario.cliente_id = destino.cliente_id
    WHERE e.envio_id = p_envio_id;

    SELECT paquete_id, almacen_id, peso, largo, ancho, alto, contenido
    FROM paquetes WHERE envio_id = p_envio_id ORDER BY paquete_id;

    SELECT rastreo_id, fecha, ubicacion_actual, estado_evento, observaciones
    FROM historial_rastreo WHERE envio_id = p_envio_id ORDER BY fecha, rastreo_id;
END$$

CREATE TRIGGER before_insert_paquete_almacen
BEFORE INSERT ON paquetes FOR EACH ROW
BEGIN
    DECLARE capacidad INT UNSIGNED DEFAULT NULL;
    DECLARE ocupados INT UNSIGNED;

    IF NEW.almacen_id IS NOT NULL THEN
        SELECT capacidad_maxima INTO capacidad
        FROM almacenes WHERE almacen_id = NEW.almacen_id FOR UPDATE;

        IF capacidad IS NOT NULL THEN
            SELECT COUNT(*) INTO ocupados
            FROM paquetes WHERE almacen_id = NEW.almacen_id FOR SHARE;

            IF ocupados >= capacidad THEN
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El almacen alcanzo su capacidad maxima';
            END IF;
        END IF;
    END IF;
END$$

CREATE TRIGGER after_update_envio_costo
AFTER UPDATE ON envios FOR EACH ROW
BEGIN
    IF OLD.costo_total <> NEW.costo_total THEN
        INSERT INTO auditoria_envios (envio_id, costo_anterior, costo_nuevo, usuario)
        VALUES (NEW.envio_id, OLD.costo_total, NEW.costo_total, USER());
    END IF;
END$$

CREATE TRIGGER after_insert_historial_rastreo
AFTER INSERT ON historial_rastreo FOR EACH ROW
BEGIN
    IF NEW.estado_evento = 'ENTREGADO' THEN
        UPDATE envios SET estado = 'ENTREGADO' WHERE envio_id = NEW.envio_id;
    END IF;
END$$

DELIMITER ;

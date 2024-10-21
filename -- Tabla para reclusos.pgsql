-- Tabla para reclusos
CREATE TABLE reclusos (
    id_recluso SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    identificación VARCHAR(50),
    delitos TEXT,
    condena VARCHAR(100),
    fecha_ingreso DATE
);

-- Tabla para visitantes
CREATE TABLE visitantes (
    id_visitante SERIAL PRIMARY KEY,
    nombre VARCHAR(100),
    identificación VARCHAR(50),
    relación_recluso VARCHAR(50)
);

-- Tabla para visitas
CREATE TABLE visitas (
    id_visita SERIAL PRIMARY KEY,
    id_recluso INT,
    id_visitante INT,
    fecha_visita DATE,
    FOREIGN KEY (id_recluso) REFERENCES reclusos(id_recluso),
    FOREIGN KEY (id_visitante) REFERENCES visitantes(id_visitante)
);

-- Tabla para personal del penal
CREATE TABLE personal (
    id_personal SERIAL PRIMARY KEY, -- Clave primaria auto incremental
    nombre VARCHAR(100) , -- Columna para el nombre
    rol VARCHAR(50) , -- Columna para el rol
    identificacion VARCHAR(50)  -- Columna para la identificación, con tilde
);

-- Tabla para reportes de actividades
CREATE TABLE reportes_actividades (
    id_reporte SERIAL PRIMARY KEY,
    tipo_actividad VARCHAR(100),
    fecha DATE,
    detalle TEXT
);

SELECT  * FROM visitantes;

ALTER TABLE reclusos RENAME COLUMN identificación TO identificacion;
ALTER TABLE reclusos ALTER COLUMN condena TYPE INT USING condena::int;

DELETE FROM visitantes;
ALTER SEQUENCE reclusos_id_recluso_seq RESTART WITH 1;
ALTER SEQUENCE visitas_id_visita_seq RESTART WITH 1;

ALTER TABLE visitantes ADD COLUMN id_recluso INT;

-- Si quieres crear la relación, puedes agregar una clave foránea:
ALTER TABLE visitantes ADD CONSTRAINT fk_recluso FOREIGN KEY (id_recluso) REFERENCES reclusos(id_recluso);


SELECT
    tc.constraint_name, 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name, 
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
JOIN 
    information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
JOIN 
    information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
WHERE 
    constraint_type = 'FOREIGN KEY' AND tc.table_name='visitas';

DELETE FROM visitantes

ALTER TABLE reclusos ADD COLUMN fecha_salida DATE;

SELECT *from personal;


ALTER TABLE visitas
ADD COLUMN cancelada BOOLEAN DEFAULT FALSE; -- Agregar campo para indicar si la visita fue cancelada

-- Modificar la relación para eliminar las visitas automáticamente si se elimina un recluso
ALTER TABLE visitas
DROP CONSTRAINT visitas_id_recluso_fkey; -- Eliminar la clave foránea existente

ALTER TABLE visitas
ADD CONSTRAINT visitas_id_recluso_fkey 
FOREIGN KEY (id_recluso) REFERENCES reclusos(id_recluso) ON DELETE CASCADE; -- Crear una nueva clave foránea con la opción de cascada


SELECT identificacion
FROM information_schema.columns
WHERE table_name = 'personal';

DROP TABLE IF EXISTS reportes_actividades; 

-- Tabla para actividades diarias
CREATE TABLE actividades (
    id_actividad SERIAL PRIMARY KEY,
    tipo_actividad VARCHAR(100),  -- Visitas, Eventos, Recreativas, etc.
    descripcion TEXT,
    fecha DATE NOT NULL
);

-- Tabla para generar los reportes
CREATE TABLE reportes_actividades (
    id_reporte SERIAL PRIMARY KEY,
    fecha_reporte DATE NOT NULL,
    total_visitas INT,
    total_eventos INT,
    total_actividades_recreativas INT
);

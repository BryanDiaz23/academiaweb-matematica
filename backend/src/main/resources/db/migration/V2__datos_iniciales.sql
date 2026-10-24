-- =====================================================================
--  Matemática Sin Estrés - Datos iniciales (seed data)
--  Migración V2 (Flyway). Las FK se resuelven con subconsultas por claves
--  naturales (codigo, nombre, username) para no depender de IDs fijos.
--
--  IMPORTANTE: las contraseñas NO se guardan en texto plano. Solo se guarda
--  el hash BCrypt (factor de costo 12). Las contraseñas reales se entregan
--  por un canal privado y deben cambiarse tras el primer ingreso en producción.
-- =====================================================================

-- Roles -----------------------------------------------------------------
INSERT INTO roles (nombre, descripcion) VALUES
    ('ADMIN',  'Administrador de la academia: gestiona usuarios, matrículas y clases'),
    ('ALUMNO', 'Estudiante: accede a sus matrículas y a las clases grabadas de su nivel');

-- Usuarios ----------------------------------------------------------------
-- Administrador principal: Bryan Díaz
INSERT INTO usuarios (nombre_completo, username, email, password_hash, rol_id)
VALUES ('Bryan Díaz', 'bryandiaz', 'bryan.diaz@matematicasinestres.pe',
        '$2a$12$JxndlHvILaTzjElK/nXZSONhlmOnDrET3DiLmloNrwIFE75RkBIDa',
        (SELECT id FROM roles WHERE nombre = 'ADMIN'));

-- Alumno de demostración (para pruebas de control de acceso)
INSERT INTO usuarios (nombre_completo, username, email, password_hash, rol_id)
VALUES ('Alumno Demostración', 'alumno.demo', 'alumno.demo@matematicasinestres.pe',
        '$2a$12$VJ.nqUTYdBrsgxh9mVKqMuMqYm1hea2njMKOuvYVqIpOHs7I/7yQe',
        (SELECT id FROM roles WHERE nombre = 'ALUMNO'));

-- Niveles -----------------------------------------------------------------
INSERT INTO niveles (codigo, nombre, subtitulo, rango_edad, precio_mensual, destacado, orden) VALUES
    ('PRIMARIA',   'Nivel Primaria',         'Construye bases sólidas sin miedo ni aburrimiento', 'Ideal 6 a 11 años',        25.00, FALSE, 1),
    ('SECUNDARIA', 'Nivel Secundaria',       'Asegura buenas notas y domina tus exámenes',        '1.º a 5.º de Secundaria',  35.00, TRUE,  2),
    ('PRE',        'Nivel Preuniversitario', 'Ingresa a la universidad con métodos de alta velocidad', 'Postulantes y Ciclo Cero', 35.00, FALSE, 3);

-- Características por nivel -----------------------------------------------
INSERT INTO nivel_caracteristicas (nivel_id, descripcion, orden) VALUES
    ((SELECT id FROM niveles WHERE codigo = 'PRIMARIA'), 'Juegos de lógica y razonamiento', 1),
    ((SELECT id FROM niveles WHERE codigo = 'PRIMARIA'), 'Operaciones fundamentales paso a paso', 2),
    ((SELECT id FROM niveles WHERE codigo = 'PRIMARIA'), 'Paciencia total y clases didácticas', 3),
    ((SELECT id FROM niveles WHERE codigo = 'PRIMARIA'), 'Acompañamiento en tareas escolares', 4),
    ((SELECT id FROM niveles WHERE codigo = 'SECUNDARIA'), 'Álgebra, Geometría y Trigonometría', 1),
    ((SELECT id FROM niveles WHERE codigo = 'SECUNDARIA'), 'Resolución de prácticas del colegio', 2),
    ((SELECT id FROM niveles WHERE codigo = 'SECUNDARIA'), 'Preparación para bimestrales y parciales', 3),
    ((SELECT id FROM niveles WHERE codigo = 'SECUNDARIA'), 'Estrategias sin memorizar fórmulas a ciegas', 4),
    ((SELECT id FROM niveles WHERE codigo = 'PRE'), 'Trucos y atajos tipo examen de admisión', 1),
    ((SELECT id FROM niveles WHERE codigo = 'PRE'), 'Simulacros intensivos cronometrados', 2),
    ((SELECT id FROM niveles WHERE codigo = 'PRE'), 'Solucionarios de exámenes de admisión', 3),
    ((SELECT id FROM niveles WHERE codigo = 'PRE'), 'Ciclo Cero y Preparación Avanzada', 4);

-- Horarios ----------------------------------------------------------------
INSERT INTO horarios (turno, hora_inicio, hora_fin, dias) VALUES
    ('Mañana', '08:00:00', '09:30:00', 'Lunes a Viernes'),
    ('Tarde',  '17:00:00', '18:30:00', 'Lunes a Viernes'),
    ('Noche',  '19:00:00', '20:30:00', 'Lunes a Viernes');

-- Clases grabadas (los enlaces son de ejemplo; el administrador los reemplaza desde el panel)
INSERT INTO clases_grabadas (titulo, descripcion, nivel_id, duracion_minutos, fecha_clase, url_video, url_pizarra, creado_por) VALUES
    ('Álgebra: Fracciones Algebraicas y Factorización', 'Simplificación de fracciones algebraicas usando casos de factorización.',
     (SELECT id FROM niveles WHERE codigo = 'SECUNDARIA'), 90, '2026-09-28',
     'https://drive.google.com/drive/folders/mse-secundaria-algebra-01', 'https://drive.google.com/drive/folders/mse-secundaria-algebra-01-pdf',
     (SELECT id FROM usuarios WHERE username = 'bryandiaz')),
    ('Geometría: Triángulos Notables y Semejanza', 'Propiedades de triángulos notables y criterios de semejanza con ejercicios tipo bimestral.',
     (SELECT id FROM niveles WHERE codigo = 'SECUNDARIA'), 80, '2026-09-21',
     'https://drive.google.com/drive/folders/mse-secundaria-geometria-02', NULL,
     (SELECT id FROM usuarios WHERE username = 'bryandiaz')),
    ('Razonamiento Matemático: Planteo de Ecuaciones', 'Cómo traducir enunciados a ecuaciones con ejemplos de la vida diaria.',
     (SELECT id FROM niveles WHERE codigo = 'PRIMARIA'), 75, '2026-09-26',
     'https://drive.google.com/drive/folders/mse-primaria-razonamiento-01', 'https://drive.google.com/drive/folders/mse-primaria-razonamiento-01-pdf',
     (SELECT id FROM usuarios WHERE username = 'bryandiaz')),
    ('Fracciones: Suma y Resta con Material Concreto', 'Fracciones homogéneas y heterogéneas explicadas con gráficos.',
     (SELECT id FROM niveles WHERE codigo = 'PRIMARIA'), 60, '2026-09-19',
     'https://drive.google.com/drive/folders/mse-primaria-fracciones-02', NULL,
     (SELECT id FROM usuarios WHERE username = 'bryandiaz')),
    ('Trigonometría PRE: Razones de Ángulos Notables', 'Razones trigonométricas de 30°, 37°, 45°, 53° y 60° con atajos de admisión.',
     (SELECT id FROM niveles WHERE codigo = 'PRE'), 105, '2026-09-27',
     'https://drive.google.com/drive/folders/mse-pre-trigonometria-01', 'https://drive.google.com/drive/folders/mse-pre-trigonometria-01-pdf',
     (SELECT id FROM usuarios WHERE username = 'bryandiaz')),
    ('Aritmética PRE: Simulacro de Razones y Proporciones', 'Simulacro cronometrado de 20 preguntas con solucionario.',
     (SELECT id FROM niveles WHERE codigo = 'PRE'), 95, '2026-09-20',
     'https://drive.google.com/drive/folders/mse-pre-aritmetica-02', NULL,
     (SELECT id FROM usuarios WHERE username = 'bryandiaz'));

-- Matrícula activa del alumno de demostración en Secundaria (turno Noche)
INSERT INTO matriculas (usuario_id, nivel_id, horario_id, estado, fecha_inicio, fecha_fin) VALUES
    ((SELECT id FROM usuarios WHERE username = 'alumno.demo'),
     (SELECT id FROM niveles WHERE codigo = 'SECUNDARIA'),
     (SELECT id FROM horarios WHERE turno = 'Noche'),
     'ACTIVA', '2026-09-01', '2026-12-31');

-- Solicitud de información de ejemplo
INSERT INTO solicitudes_informacion (nombre, telefono, email, nivel_id, mensaje) VALUES
    ('Rosa Quispe', '987111222', 'rosa.quispe@correo.pe', (SELECT id FROM niveles WHERE codigo = 'PRIMARIA'),
     'Quisiera la clase de diagnóstico para mi hijo de 3.er grado.');

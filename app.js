const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const port = 3000;
const path = require('path');

// Conexión a PostgreSQL
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'sistema_carcelario',
  password: '1234',
  port: 5432,
});

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Rutas para servir archivos HTML
app.get('/reclusos-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/reclusos.html'));
});
app.get('/visitas-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/visitas.html'));
});

app.get('/personal-page', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/personal.html'));
});

// Obtener todos los reclusos
app.get('/reclusos', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reclusos');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener los reclusos');
  }
});

// Obtener un recluso por ID
app.get('/reclusos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM reclusos WHERE id_recluso = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('Recluso no encontrado');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener el recluso');
  }
});

// Agregar un nuevo recluso
app.post('/reclusos', async (req, res) => {
  const { nombre, identificacion, delito, condena, fecha_ingreso } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO reclusos (nombre, identificacion, delitos, condena, fecha_ingreso) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [nombre, identificacion, delito, condena, fecha_ingreso ]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al agregar recluso');
  }
});

// Editar un recluso
app.put('/reclusos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, identificacion, delito, condena, fecha_ingreso } = req.body;
  try {
    const result = await pool.query(
      'UPDATE reclusos SET nombre = $1, identificacion = $2, delitos = $3, condena = $4, fecha_ingreso = $5  WHERE id_recluso = $6 RETURNING *',
      [nombre, identificacion, delito, condena, fecha_ingreso,  id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Recluso no encontrado');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al editar recluso');
  }
});

// Eliminar un recluso
app.delete('/reclusos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Verificar que el recluso existe
    const recluso = await pool.query('SELECT * FROM reclusos WHERE id_recluso = $1', [id]);
    if (recluso.rows.length === 0) {
      return res.status(404).send('Recluso no encontrado');
    }

    // Eliminar visitas asociadas
    await pool.query('DELETE FROM visitas WHERE id_recluso = $1', [id]);

    // Eliminar el recluso
    await pool.query('DELETE FROM reclusos WHERE id_recluso = $1', [id]);
    res.send('Recluso eliminado');
  } catch (err) {
    console.error(err); // Imprimir el error en la consola
    res.status(500).send('Error al eliminar recluso');
  }
});


// Agregar una nueva visita
app.post('/visitas', async (req, res) => {
  const { id_recluso, id_visitante, fecha_visita } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO visitas (id_recluso, id_visitante, fecha_visita) VALUES ($1, $2, $3) RETURNING *',
      [id_recluso, id_visitante, fecha_visita]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al registrar la visita');
  }
});

// Obtener historial de visitas por recluso
app.get('/visitas/recluso/:id_recluso', async (req, res) => {
  const { id_recluso } = req.params;
  try {
    const result = await pool.query(
      `SELECT v.id_visita, v.fecha_visita, vi.nombre AS visitante_nombre, vi.identificación, vi.relación_recluso 
       FROM visitas v 
       JOIN visitantes vi ON v.id_visitante = vi.id_visitante 
       WHERE v.id_recluso = $1`,
      [id_recluso]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener el historial de visitas');
  }
});

// Agregar un nuevo visitante
app.post('/visitantes', async (req, res) => {
  const { nombre, identificación, relación_recluso, id_recluso } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO visitantes (nombre, identificación, relación_recluso, id_recluso) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, identificación, relación_recluso, id_recluso]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al registrar el visitante');
  }
});

// Ruta para obtener todos los visitantes
app.get('/visitantes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM visitantes');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener visitantes:', error);
    res.status(500).send('Error al obtener visitantes');
  }
});

// Ruta para obtener la lista de personal
app.get('/personal', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM personal');
    res.json(result.rows);
  } catch (error) {
    console.error('Error al obtener personal:', error);
    res.status(500).json({ message: 'Error al obtener personal', error: error.message });
  }
});

// Ruta para agregar personal
app.post('/personal', async (req, res) => {
  const { nombre, rol, identificacion } = req.body; // Asegúrate de que el nombre de la variable coincide

  try {
      const result = await pool.query(
          'INSERT INTO personal (nombre, rol, identificacion) VALUES ($1, $2, $3) RETURNING *',
          [nombre, rol, identificacion] // Pasar los parámetros en el orden correcto
      );
      res.status(201).json({ message: 'Personal agregado', data: result.rows[0] });
  } catch (error) {
      console.error('Error al agregar personal:', error);
      res.status(500).json({ message: 'Error al agregar personal', error: error.message });
  }
});

// Editar un empleado
app.put('/personal/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, identificacion, rol} = req.body;
  try {
    const result = await pool.query(
      'UPDATE personal SET nombre = $1, identificacion = $2, rol = $3 WHERE id_personal = $4 RETURNING *',
      [nombre, identificacion, rol, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).send('Empleado no encontrado');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al editar Empleado');
  }
});


// Obtener un empleado por ID
app.get('/personal/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM personal WHERE id_personal = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).send('personal no encontrado');
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al obtener el empleado');
  }
});

// Ruta para eliminar un empleado
app.delete('/personal/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM personal WHERE id_personal = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Personal no encontrado' });
    }
    res.json({ message: 'Personal eliminado con éxito' });
  } catch (error) {
    console.error('Error al eliminar personal:', error);
    res.status(500).json({ message: 'Error al eliminar personal', error: error.message });
  }
});


// Registrar una nueva actividad
app.post('/actividades', async (req, res) => {
  const { tipo_actividad, descripcion, fecha } = req.body;
  try {
      const result = await pool.query(
          'INSERT INTO actividades (tipo_actividad, descripcion, fecha) VALUES ($1, $2, $3) RETURNING *',
          [tipo_actividad, descripcion, fecha]
      );
      res.status(201).json(result.rows[0]);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error al registrar la actividad');
  }
});

// Generar un reporte diario
app.get('/reporte-actividades/:fecha', async (req, res) => {
  const { fecha } = req.params;
  try {
      // Consulta para contar las actividades por tipo
      const visitas = await pool.query(
          'SELECT COUNT(*) AS total_visitas FROM actividades WHERE tipo_actividad = $1 AND fecha = $2',
          ['Visita', fecha]
      );

      const eventos = await pool.query(
          'SELECT COUNT(*) AS total_eventos FROM actividades WHERE tipo_actividad = $1 AND fecha = $2',
          ['Evento', fecha]
      );

      const recreativas = await pool.query(
          'SELECT COUNT(*) AS total_actividades_recreativas FROM actividades WHERE tipo_actividad = $1 AND fecha = $2',
          ['Recreativa', fecha]
      );

      // Crear el reporte
      const reporte = {
          fecha_reporte: fecha,
          total_visitas: visitas.rows[0].total_visitas,
          total_eventos: eventos.rows[0].total_eventos,
          total_actividades_recreativas: recreativas.rows[0].total_actividades_recreativas
      };

      // Guardar el reporte en la base de datos
      await pool.query(
          'INSERT INTO reportes_actividades (fecha_reporte, total_visitas, total_eventos, total_actividades_recreativas) VALUES ($1, $2, $3, $4)',
          [reporte.fecha_reporte, reporte.total_visitas, reporte.total_eventos, reporte.total_actividades_recreativas]
      );

      res.status(200).json(reporte);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error al generar el reporte');
  }
});

// Obtener todas las actividades
app.get('/actividades', async (req, res) => {
  try {
      const result = await pool.query('SELECT * FROM actividades');
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error al obtener el historial de actividades');
  }
});

// Obtener todas las actividades
app.get('/actividades', async (req, res) => {
  try {
      const result = await pool.query('SELECT * FROM actividades');
      res.json(result.rows);
  } catch (err) {
      console.error(err);
      res.status(500).send('Error al obtener el historial de actividades');
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

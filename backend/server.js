const db = require('./database');

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => {
  res.json({ message: 'Servidor backend funcionando correctamente ✅' });
});

//Crear una nueva partida
app.post('/api/partidas', (req, res) => {
  const { estado, tipo_rondas, turno_actual, cronometro_restante, fecha_creacion } = req.body;

  const sql = `INSERT INTO partidas 
    (estado, tipo_rondas, turno_actual, cronometro_restante, fecha_creacion) 
    VALUES (?, ?, ?, ?, ?)`;

  const params = [estado, tipo_rondas, turno_actual, cronometro_restante, fecha_creacion];

  db.run(sql, params, function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Error al insertar la partida' });
    } else {
      res.status(201).json({ id: this.lastID });
    }
  });
});

//Obtener todas las partidas
app.get('/api/partidas', (req, res) => {
  const query = 'SELECT * FROM partidas';

  db.all(query, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al obtener las partidas' });
    }
    res.status(200).json(rows);
  });
});

app.post('/api/equipos', (req, res) => {
  const { nombre, partida_id } = req.body;
  const query = `INSERT INTO equipos (nombre, partida_id) VALUES (?, ?)`;

  db.run(query, [nombre, partida_id], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al crear el equipo' });
    }
    res.status(201).json({ id: this.lastID });
  });
});

//Obtener todos los equipos de una partida específica
app.get('/api/equipos/:partida_id', (req, res) => {
  const { partida_id } = req.params;
  const query = 'SELECT * FROM equipos WHERE partida_id = ?';

  db.all(query, [partida_id], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al obtener los equipos' });
    }
    res.status(200).json(rows);
  });
});

app.post('/api/jugadores', (req, res) => {
  const { nombre, equipo_id, orden_en_equipo } = req.body;
  const query = `INSERT INTO jugadores (nombre, equipo_id, orden_en_equipo) VALUES (?, ?, ?)`;

  db.run(query, [nombre, equipo_id, orden_en_equipo], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al crear el jugador' });
    }
    res.status(201).json({ id: this.lastID });
  });
});

//Obtener todos los jugadores de un equipo específico
app.get('/api/jugadores/:equipo_id', (req, res) => {
  const { equipo_id } = req.params;
  const query = 'SELECT * FROM jugadores WHERE equipo_id = ?';

  db.all(query, [equipo_id], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al obtener los jugadores' });
    }
    res.status(200).json(rows);
  });
});

app.post('/api/palabras', (req, res) => {
  const { texto, estado, partida_id, equipo_id } = req.body;
  const query = `INSERT INTO palabras (texto, estado, partida_id, equipo_id) VALUES (?, ?, ?, ?)`;

  db.run(query, [texto, estado, partida_id, equipo_id], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al crear la palabra' });
    }
    res.status(201).json({ id: this.lastID });
  });
});

//Obtener todas las palabras de una partida específica
app.get('/api/palabras/:partida_id', (req, res) => {
  const { partida_id } = req.params;
  const query = 'SELECT * FROM palabras WHERE partida_id = ?';

  db.all(query, [partida_id], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al obtener las palabras' });
    }
    res.status(200).json(rows);
  });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
const db = require('./database');

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get('/api/ping', (req, res) => {
  res.json({ message: 'Servidor backend funcionando correctamente' });
});

//Crear una nueva partida
app.post('/api/partidas', (req, res) => {
  const { estado, tipo_rondas, turno_actual, cronometro_restante, fecha_creacion, tematicas } = req.body;

  const sql = `INSERT INTO partidas 
    (estado, tipo_rondas, turno_actual, cronometro_restante, fecha_creacion, tematicas) 
    VALUES (?, ?, ?, ?, ?, ?)`;

  const tematicasDefault = tematicas || ["DESCRIBE LIBREMENTE", "DESCRIBE CON UNA PALABRA", "MÍMICA"];

  const params = [estado, tipo_rondas, turno_actual, cronometro_restante, fecha_creacion, JSON.stringify(tematicasDefault)];

  db.run(sql, params, function (err) {
    if (err) {
      console.error(err.message);
      res.status(500).json({ error: 'Error al insertar la partida' });
    } else {
      res.status(201).json({ id: this.lastID });
    }
  });
});

//Obtener solo el estado de una partida específica por ID
app.get('/api/partidas/estado/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT estado FROM partidas WHERE id = ?';

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al obtener el estado de la partida' });
    }
    if (row) {
      res.status(200).json({ estado: row.estado });
    } else {
      res.status(404).json({ message: 'Partida no encontrada' });
    }
  });
});

//Obtener las temáticas de una partida específica por ID
app.get('/api/partidas/tematicas/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT tematicas FROM partidas WHERE id = ?';

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al obtener las temáticas de la partida' });
    }
    if (row) {
      const tematicas = JSON.parse(row.tematicas);
      res.status(200).json({ tematicas });
    } else {
      res.status(404).json({ message: 'Partida no encontrada' });
    }
  });
});

//Actualizar el estado de la partida con la siguiente temática
app.put('/api/partidas/siguiente-tematica/:id', (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;

  console.log('Recibido estado:', estado);

  const query = `
    UPDATE partidas
    SET estado = ?
    WHERE id = ?
  `;

  db.run(query, [estado, id], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al actualizar la partida con la siguiente temática' });
    }
    res.status(200).json({ message: 'Estado actualizado correctamente', estado: estado });
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

//Obtener todos los equipos de una partida específica según el ID
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

//Actualizar datos de partida: número de rondas, estado y temáticas
app.put('/api/partidas/:id', (req, res) => {
  const { numero_rondas, tematicas, estado } = req.body;
  const { id } = req.params;

  console.log("numero_rondas:", numero_rondas);
  console.log("tematicas:", tematicas);
  console.log("estado:", estado);

  const query = `
    UPDATE partidas 
    SET numero_rondas = ?, tematicas = ?, estado = ?
    WHERE id = ?
  `;

  db.run(query, [numero_rondas, JSON.stringify(tematicas), estado, id], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al actualizar la partida' });
    }
    res.status(200).json({ message: 'Partida actualizada correctamente' });
  });
});

//Guardar el orden de turnos de jugadores para una partida
app.post('/api/orden-turnos', (req, res) => {
  const { partida_id, orden } = req.body;

  const stmt = db.prepare(`
    INSERT INTO orden_turnos (partida_id, jugador_id, turno)
    VALUES (?, ?, ?)
  `);

  orden.forEach((item, index) => {
    stmt.run(partida_id, item.jugador_id, index);
  });

  stmt.finalize(err => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al guardar el orden de turnos' });
    }
    res.status(201).json({ message: 'Orden de turnos guardado correctamente' });
  });
});

//Obtener orden de jugadores por partida
app.get('/api/orden-turnos/:partida_id', (req, res) => {
  const { partida_id } = req.params;
  const query = `
    SELECT ot.turno, j.id as jugador_id, j.nombre, j.equipo_id
    FROM orden_turnos ot
    JOIN jugadores j ON ot.jugador_id = j.id
    WHERE ot.partida_id = ?
    ORDER BY ot.turno ASC
  `;

  db.all(query, [partida_id], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al obtener el orden de jugadores' });
    }
    res.status(200).json(rows);
  });
});

app.put('/api/palabras/:id', (req, res) => {
  const { estado } = req.body
  const { id } = req.params
  const query = 'UPDATE palabras SET estado = ? WHERE id = ?'

  db.run(query, [estado, id], function (err) {
    if (err) {
      console.error(err.message)
      return res.status(500).json({ error: 'Error al actualizar palabra' })
    }
    res.status(200).json({ message: 'Palabra actualizada' })
  })
})

app.get('/api/jugador/:id', (req, res) => {
  const { id } = req.params
  const query = 'SELECT * FROM jugadores WHERE id = ?'

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error(err.message)
      return res.status(500).json({ error: 'Error al obtener el jugador' })
    }
    res.status(200).json(row)
  })
})

app.get('/api/test', (req, res) => {
  res.json({ message: 'Conexión entre frontend y backend' });
});

app.put('/api/equipos/:id', (req, res) => {
  const { puntos } = req.body;
  const { id } = req.params;
  const query = 'UPDATE equipos SET puntos = puntos + ? WHERE id = ?';

  db.run(query, [puntos, id], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al actualizar los puntos del equipo' });
    }
    res.status(200).json({ message: 'Puntos actualizados correctamente' });
  });
});

//Actualizar el estado de una palabra
app.put('/api/palabras/:id', (req, res) => {
  const { estado } = req.body;
  const { id } = req.params;
  const query = 'UPDATE palabras SET estado = ? WHERE id = ?';

  db.run(query, [estado, id], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al actualizar palabra' });
    }
    res.status(200).json({ message: 'Palabra actualizada' });
  });
});

//Actualizar puntos del equipo
app.put('/api/equipos/:id', (req, res) => {
  const { puntos } = req.body;
  const { id } = req.params;
  const query = 'UPDATE equipos SET puntos = puntos + ? WHERE id = ?';

  db.run(query, [puntos, id], function (err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al actualizar los puntos del equipo' });
    }
    res.status(200).json({ message: 'Puntos actualizados correctamente' });
  });
});

//Obtener las palabras pendientes de una partida
app.get('/api/palabras/pendientes/:partida_id', (req, res) => {
  const { partida_id } = req.params;
  const query = 'SELECT * FROM palabras WHERE partida_id = ? AND estado = "pendiente"';

  db.all(query, [partida_id], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al obtener las palabras pendientes' });
    }
    res.status(200).json(rows);
  });
});

//Obtener el número de palabras por persona (en numero_rondas)
app.get('/api/partidas/numero-palabras/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT numero_rondas FROM partidas WHERE id = ?';

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al obtener el número de palabras por persona' });
    }
    if (row) {
      res.status(200).json({ numero_palabras: row.numero_rondas });
    } else {
      res.status(404).json({ message: 'Partida no encontrada' });
    }
  });
});

//Obtener el cronómetro restante de una partida específica según el ID
app.get('/api/partidas/cronometro_restante/:id', (req, res) => {
  const { id } = req.params;
  const query = 'SELECT cronometro_restante FROM partidas WHERE id = ?';

  db.get(query, [id], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Error al obtener el cronómetro restante de la partida' });
    }
    if (row) {
      res.status(200).json({ cronometro_restante: row.cronometro_restante });
    } else {
      res.status(404).json({ message: 'Partida no encontrada' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
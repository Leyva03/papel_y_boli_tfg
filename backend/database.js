const sqlite3 = require('sqlite3').verbose();

//Crear o abrir base de datos "juego.db"
const db = new sqlite3.Database('./juego.db', (err) => {
  if (err) {
    console.error('Error al abrir la base de datos', err.message);
  } else {
    console.log('Conectado a la base de datos SQLite.');
  }
});

//Crear tablas si no existen
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS partidas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estado TEXT,
    tipo_rondas TEXT,
    turno_actual INTEGER,
    cronometro_restante INTEGER,
    fecha_creacion TEXT,
    numero_rondas INTEGER,
    tematicas TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS orden_turnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    partida_id INTEGER NOT NULL,
    jugador_id INTEGER NOT NULL,
    turno INTEGER NOT NULL,
    FOREIGN KEY (partida_id) REFERENCES partidas(id),
    FOREIGN KEY (jugador_id) REFERENCES jugadores(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS equipos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    partida_id INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS jugadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    equipo_id INTEGER,
    orden_en_equipo INTEGER
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS palabras (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    texto TEXT,
    estado TEXT,
    partida_id INTEGER,
    equipo_id INTEGER
  )`);

  db.run(`ALTER TABLE equipos ADD COLUMN puntos INTEGER DEFAULT 0`);

});

module.exports = db;

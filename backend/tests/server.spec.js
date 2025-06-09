const request = require('supertest');
const app = require('../server');
const db = require('../database');

jest.mock('../database', () => ({
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  prepare: jest.fn(() => ({
    run: jest.fn(),
    finalize: jest.fn(callback => callback(null)),
  })),
}));

describe('API Endpoints', () => {
  const resetDbMocks = () => {
    db.run.mockReset();
    db.get.mockReset();
    db.all.mockReset();
    db.prepare.mockReset();
    db.prepare.mockImplementation(() => ({
        run: jest.fn(),
        finalize: jest.fn(callback => callback(null)),
    }));
  };

  beforeEach(() => {
    resetDbMocks();
  });

  describe('GET /api/ping', () => {
    it('should return 200 OK and a success message', async () => {
      const response = await request(app).get('/api/ping');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ message: 'Servidor backend funcionando correctamente' });
    });
  });

  describe('POST /api/partidas', () => {
    const validPartidaData = {
      estado: 'configuracion',
      tipo_rondas: 'default',
      turno_actual: 0,
      cronometro_restante: 60,
      fecha_creacion: new Date().toISOString(),
      tematicas: ['Custom1', 'Custom2'],
    };

    it('should create a new partida and return 201 with the new ID', async () => {
      const mockInsertedId = 1;
      db.run.mockImplementation((sql, params, callback) => {
        callback.call({ lastID: mockInsertedId }, null);
      });
      const response = await request(app).post('/api/partidas').send(validPartidaData);
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({ id: mockInsertedId });
    });

    it('should use default tematicas if none are provided', async () => {
      const partidaDataNoTematicas = { ...validPartidaData };
      delete partidaDataNoTematicas.tematicas;
      const defaultTematicas = ["DESCRIBE LIBREMENTE", "DESCRIBE CON UNA PALABRA", "MÍMICA"];
      db.run.mockImplementation((sql, params, callback) => {
        callback.call({ lastID: 2 }, null);
      });
      await request(app).post('/api/partidas').send(partidaDataNoTematicas);
      expect(db.run).toHaveBeenCalledWith(
        expect.any(String),
        expect.arrayContaining([JSON.stringify(defaultTematicas)]),
        expect.any(Function)
      );
    });

    it('should return 500 if database insertion fails', async () => {
      db.run.mockImplementation((sql, params, callback) => {
        callback.call({}, new Error('DB Insert Error'));
      });
      const response = await request(app).post('/api/partidas').send(validPartidaData);
      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({ error: 'Error al insertar la partida' });
    });
  });

  describe('GET /api/partidas/estado/:id', () => {
    it('should return 200 and the partida estado if found', async () => {
      const mockEstado = 'en_curso';
      db.get.mockImplementation((sql, params, callback) => callback(null, { estado: mockEstado }));
      const response = await request(app).get('/api/partidas/estado/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ estado: mockEstado });
    });

    it('should return 404 if partida not found', async () => {
      db.get.mockImplementation((sql, params, callback) => callback(null, null));
      const response = await request(app).get('/api/partidas/estado/999');
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ message: 'Partida no encontrada' });
    });

    it('should return 500 on database error', async () => {
      db.get.mockImplementation((sql, params, callback) => callback(new Error('DB Select Error'), null));
      const response = await request(app).get('/api/partidas/estado/1');
      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({ error: 'Error al obtener el estado de la partida' });
    });
  });

  describe('GET /api/partidas/tematicas/:id', () => {
    it('should return 200 and parsed tematicas if found', async () => {
      const mockTematicasArray = ['Tema1', 'Tema2'];
      db.get.mockImplementation((sql, params, callback) => callback(null, { tematicas: JSON.stringify(mockTematicasArray) }));
      const response = await request(app).get('/api/partidas/tematicas/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ tematicas: mockTematicasArray });
    });

    it('should return 404 if partida not found for tematicas', async () => {
      db.get.mockImplementation((sql, params, callback) => callback(null, null));
      const response = await request(app).get('/api/partidas/tematicas/999');
      expect(response.statusCode).toBe(404);
      expect(response.body).toEqual({ message: 'Partida no encontrada' });
    });

    it('should return 500 on database error for tematicas', async () => {
      db.get.mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null));
      const response = await request(app).get('/api/partidas/tematicas/1');
      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({ error: 'Error al obtener las temáticas de la partida' });
    });
  });

  describe('PUT /api/partidas/siguiente-tematica/:id', () => {
    const nuevoEstado = "Ronda Nueva";
    it('should return 200 and update estado', async () => {
      db.run.mockImplementation((sql, params, callback) => callback.call({}, null));
      const response = await request(app).put('/api/partidas/siguiente-tematica/1').send({ estado: nuevoEstado });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ message: 'Estado actualizado correctamente', estado: nuevoEstado });
      expect(db.run).toHaveBeenCalledWith(expect.stringMatching(/UPDATE\s+partidas\s+SET\s+estado\s*=\s*\?\s+WHERE\s+id\s*=\s*\?/s), [nuevoEstado, '1'], expect.any(Function));
    });

    it('should return 500 on database error for siguiente-tematica', async () => {
      db.run.mockImplementation((sql, params, callback) => callback.call({}, new Error('DB Error')));
      const response = await request(app).put('/api/partidas/siguiente-tematica/1').send({ estado: nuevoEstado });
      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({ error: 'Error al actualizar la partida con la siguiente temática' });
    });
  });

  describe('GET /api/partidas', () => {
    it('should return 200 and all partidas', async () => {
      const mockAllPartidas = [{ id: 1, estado: 'finalizada' }, { id: 2, estado: 'configuracion' }];
      db.all.mockImplementation((sql, params, callback) => callback(null, mockAllPartidas));
      const response = await request(app).get('/api/partidas');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockAllPartidas);
    });

    it('should return 500 on database error when getting all partidas', async () => {
      db.all.mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null));
      const response = await request(app).get('/api/partidas');
      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({ error: 'Error al obtener las partidas' });
    });
  });

  describe('POST /api/equipos', () => {
    const newEquipoData = { nombre: 'Vencedores', partida_id: 1 };
    it('should create an equipo and return 201 with ID', async () => {
      db.run.mockImplementation((sql, params, callback) => callback.call({ lastID: 5 }, null));
      const response = await request(app).post('/api/equipos').send(newEquipoData);
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({ id: 5 });
    });

    it('should return 500 on database error when creating equipo', async () => {
      db.run.mockImplementation((sql, params, callback) => callback.call({}, new Error('DB Error')));
      const response = await request(app).post('/api/equipos').send(newEquipoData);
      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({ error: 'Error al crear el equipo' });
    });
  });

  describe('GET /api/equipos/:partida_id', () => {
    it('should return 200 and equipos for a partida_id', async () => {
      const mockEquipos = [{ id: 1, nombre: 'Equipo A', partida_id: '1' }];
      db.all.mockImplementation((sql, params, callback) => callback(null, mockEquipos));
      const response = await request(app).get('/api/equipos/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockEquipos);
      expect(db.all).toHaveBeenCalledWith(expect.any(String), ['1'], expect.any(Function));
    });

    it('should return 200 and an empty array if partida_id not found or no equipos', async () => {
      db.all.mockImplementation((sql, params, callback) => callback(null, []));
      const response = await request(app).get('/api/equipos/999');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });

    it('should return 500 on database error for equipos by partida_id', async () => {
      db.all.mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null));
      const response = await request(app).get('/api/equipos/1');
      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({ error: 'Error al obtener los equipos' });
    });
  });

  describe('POST /api/jugadores', () => {
    const newJugadorData = { nombre: 'Player1', equipo_id: 1, orden_en_equipo: 0 };
    it('should create a jugador and return 201 with ID', async () => {
      db.run.mockImplementation((sql, params, callback) => callback.call({ lastID: 7 }, null));
      const response = await request(app).post('/api/jugadores').send(newJugadorData);
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({ id: 7 });
    });

    it('should return 500 on database error when creating jugador', async () => {
      db.run.mockImplementation((sql, params, callback) => callback.call({}, new Error('DB Error')));
      const response = await request(app).post('/api/jugadores').send(newJugadorData);
      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({ error: 'Error al crear el jugador' });
    });
  });

  describe('GET /api/jugadores/:equipo_id', () => {
    it('should return 200 and jugadores for an equipo_id', async () => {
      const mockJugadores = [{ id: 1, nombre: 'Player A', equipo_id: '1' }];
      db.all.mockImplementation((sql, params, callback) => callback(null, mockJugadores));
      const response = await request(app).get('/api/jugadores/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockJugadores);
      expect(db.all).toHaveBeenCalledWith(expect.any(String), ['1'], expect.any(Function));
    });
     it('should return 200 and an empty array if equipo_id not found or no jugadores', async () => {
      db.all.mockImplementation((sql, params, callback) => callback(null, []));
      const response = await request(app).get('/api/jugadores/999');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });
    it('should return 500 on database error for jugadores by equipo_id', async () => {
        db.all.mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null));
        const response = await request(app).get('/api/jugadores/1');
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Error al obtener los jugadores'});
    });
  });

  describe('POST /api/palabras', () => {
    const newPalabraData = { texto: 'Test', estado: 'pendiente', partida_id: 1, equipo_id: 1 };
    it('should create a palabra and return 201 with ID', async () => {
      db.run.mockImplementation((sql, params, callback) => callback.call({ lastID: 10 }, null));
      const response = await request(app).post('/api/palabras').send(newPalabraData);
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({ id: 10 });
    });
    it('should return 500 on database error when creating palabra', async () => {
        db.run.mockImplementation((sql, params, callback) => callback.call({}, new Error('DB Error')));
        const response = await request(app).post('/api/palabras').send(newPalabraData);
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Error al crear la palabra'});
    });
  });

  describe('GET /api/palabras/:partida_id', () => {
    it('should return 200 and palabras for a partida_id', async () => {
      const mockPalabras = [{ id: 1, texto: 'Palabra1', partida_id: '1' }];
      db.all.mockImplementation((sql, params, callback) => callback(null, mockPalabras));
      const response = await request(app).get('/api/palabras/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockPalabras);
    });
     it('should return 200 and an empty array if partida_id not found or no palabras', async () => {
      db.all.mockImplementation((sql, params, callback) => callback(null, []));
      const response = await request(app).get('/api/palabras/999');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual([]);
    });
    it('should return 500 on database error when getting palabras by partida_id', async () => {
        db.all.mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null));
        const response = await request(app).get('/api/palabras/1');
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Error al obtener las palabras'});
    });
  });

  describe('PUT /api/palabras/:id (update estado)', () => {
    it('should update palabra estado and return 200', async () => {
      db.run.mockImplementation((sql, params, callback) => callback.call({}, null));
      const response = await request(app).put('/api/palabras/1').send({ estado: 'acertada' });
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ message: 'Palabra actualizada' });
      expect(db.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE palabras SET estado = ?'), ['acertada', '1'], expect.any(Function));
    });
    it('should return 500 on database error when updating palabra estado', async () => {
        db.run.mockImplementation((sql, params, callback) => callback.call({}, new Error('DB Error')));
        const response = await request(app).put('/api/palabras/1').send({ estado: 'acertada' });
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Error al actualizar palabra'});
    });
  });

  describe('PUT /api/partidas/:id', () => {
    const updateData = { numero_rondas: 5, tematicas: ['A', 'B'], estado: 'jugando' };
    it('should update partida and return 200', async () => {
      db.run.mockImplementation((sql, params, callback) => callback.call({}, null));
      const response = await request(app).put('/api/partidas/1').send(updateData);
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual({ message: 'Partida actualizada correctamente' });
    });
     it('should return 500 on database error when updating partida', async () => {
        db.run.mockImplementation((sql, params, callback) => callback.call({}, new Error('DB Error')));
        const response = await request(app).put('/api/partidas/1').send(updateData);
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Error al actualizar la partida'});
    });
  });

  describe('POST /api/orden-turnos', () => {
    const ordenData = { partida_id: 1, orden: [{ jugador_id: 1 }, { jugador_id: 2 }] };
    let mockStmt;

    beforeEach(() => {
      mockStmt = {
        run: jest.fn(),
        finalize: jest.fn(callback => callback(null))
      };
      db.prepare.mockReturnValue(mockStmt);
    });

    it('should save orden de turnos and return 201', async () => {
      const response = await request(app).post('/api/orden-turnos').send(ordenData);
      expect(response.statusCode).toBe(201);
      expect(response.body).toEqual({ message: 'Orden de turnos guardado correctamente' });
      expect(db.prepare).toHaveBeenCalledTimes(1);
      expect(mockStmt.run).toHaveBeenCalledTimes(ordenData.orden.length);
      expect(mockStmt.finalize).toHaveBeenCalledTimes(1);
    });

    it('should return 500 on finalize error', async () => {
      const finalizeError = new Error('Finalize DB Error');
      mockStmt.finalize.mockImplementation(callback => callback(finalizeError));

      const response = await request(app).post('/api/orden-turnos').send(ordenData);
      expect(response.statusCode).toBe(500);
      expect(response.body).toEqual({ error: 'Error al guardar el orden de turnos' });
    });
  });

  describe('GET /api/orden-turnos/:partida_id', () => {
    it('should return 200 and the turn order', async () => {
      const mockOrder = [{ turno: 0, jugador_id: 1, nombre: 'Alice', equipo_id: 'e1' }];
      db.all.mockImplementation((sql, params, callback) => callback(null, mockOrder));
      const response = await request(app).get('/api/orden-turnos/1');
      expect(response.statusCode).toBe(200);
      expect(response.body).toEqual(mockOrder);
    });
    it('should return 500 on database error when getting turn order', async () => {
        db.all.mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null));
        const response = await request(app).get('/api/orden-turnos/1');
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Error al obtener el orden de jugadores'});
    });
  });

  describe('GET /api/jugador/:id', () => {
    it('should return 200 and the jugador if found', async () => {
        const mockJugador = { id: 1, nombre: 'Alice' };
        db.get.mockImplementation((sql, params, callback) => callback(null, mockJugador));
        const response = await request(app).get('/api/jugador/1');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockJugador);
    });
    it('should return 200 and null if jugador not found (as per sqlite3 db.get)', async () => {
        db.get.mockImplementation((sql, params, callback) => callback(null, null));
        const response = await request(app).get('/api/jugador/999');
        expect(response.statusCode).toBe(200);
        expect(response.body).toBeNull();
    });
    it('should return 500 on database error for jugador by id', async () => {
        db.get.mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null));
        const response = await request(app).get('/api/jugador/1');
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Error al obtener el jugador'});
    });
  });

  describe('GET /api/test', () => {
    it('should return 200 and a specific message', async () => {
        const response = await request(app).get('/api/test');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'Conexión entre frontend y backend' });
    });
  });

  describe('PUT /api/equipos/:id (update puntos)', () => {
    it('should update equipo puntos and return 200', async () => {
        db.run.mockImplementation((sql, params, callback) => callback.call({}, null));
        const response = await request(app).put('/api/equipos/1').send({ puntos: 10 });
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ message: 'Puntos actualizados correctamente'});
        expect(db.run).toHaveBeenCalledWith(expect.stringContaining('UPDATE equipos SET puntos = puntos + ?'), [10, '1'], expect.any(Function));
    });
    it('should return 500 on database error when updating equipo puntos', async () => {
        db.run.mockImplementation((sql, params, callback) => callback.call({}, new Error('DB Error')));
        const response = await request(app).put('/api/equipos/1').send({ puntos: 10 });
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Error al actualizar los puntos del equipo'});
    });
  });

  describe('GET /api/palabras/pendientes/:partida_id', () => {
    it('should return 200 and only pending palabras', async () => {
        const mockPendingPalabras = [{id: 1, texto: 'Pendiente', estado: 'pendiente', partida_id: '1'}];
        db.all.mockImplementation((sql, params, callback) => callback(null, mockPendingPalabras));
        const response = await request(app).get('/api/palabras/pendientes/1');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual(mockPendingPalabras);
    });
     it('should return 200 and an empty array if no pending palabras', async () => {
        db.all.mockImplementation((sql, params, callback) => callback(null, []));
        const response = await request(app).get('/api/palabras/pendientes/1');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual([]);
    });
    it('should return 500 on database error for pending palabras', async () => {
        db.all.mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null));
        const response = await request(app).get('/api/palabras/pendientes/1');
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Error al obtener las palabras pendientes'});
    });
  });

  describe('GET /api/partidas/numero-palabras/:id', () => {
    it('should return 200 and numero_palabras if found', async () => {
        const mockData = { numero_rondas: 5 };
        db.get.mockImplementation((sql, params, callback) => callback(null, mockData));
        const response = await request(app).get('/api/partidas/numero-palabras/1');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ numero_palabras: mockData.numero_rondas });
    });
    it('should return 404 if partida not found for numero-palabras', async () => {
        db.get.mockImplementation((sql, params, callback) => callback(null, null));
        const response = await request(app).get('/api/partidas/numero-palabras/999');
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({ message: 'Partida no encontrada'});
    });
    it('should return 500 on database error for numero-palabras', async () => {
        db.get.mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null));
        const response = await request(app).get('/api/partidas/numero-palabras/1');
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Error al obtener el número de palabras por persona'});
    });
  });

  describe('GET /api/partidas/cronometro_restante/:id', () => {
    it('should return 200 and cronometro_restante if found', async () => {
        const mockData = { cronometro_restante: 55 };
        db.get.mockImplementation((sql, params, callback) => callback(null, mockData));
        const response = await request(app).get('/api/partidas/cronometro_restante/1');
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({ cronometro_restante: mockData.cronometro_restante });
    });
    it('should return 404 if partida not found for cronometro_restante', async () => {
        db.get.mockImplementation((sql, params, callback) => callback(null, null));
        const response = await request(app).get('/api/partidas/cronometro_restante/999');
        expect(response.statusCode).toBe(404);
        expect(response.body).toEqual({ message: 'Partida no encontrada'});
    });
    it('should return 500 on database error for cronometro_restante', async () => {
        db.get.mockImplementation((sql, params, callback) => callback(new Error('DB Error'), null));
        const response = await request(app).get('/api/partidas/cronometro_restante/1');
        expect(response.statusCode).toBe(500);
        expect(response.body).toEqual({ error: 'Error al obtener el cronómetro restante de la partida'});
    });
  });
});
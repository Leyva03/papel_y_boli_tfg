import { mount, flushPromises } from '@vue/test-utils';
import ConfiguracionEquiposView from '@/views/ConfiguracionEquiposView.vue';
import axios from 'axios';

const mockRouterPush = jest.fn();
jest.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

let mockLocalStorageStore = {};
const localStorageMock = {
  getItem: jest.fn(key => mockLocalStorageStore[key] || null),
  setItem: jest.fn((key, value) => {
    mockLocalStorageStore[key] = value.toString();
  }),
  clear: jest.fn(() => {
    mockLocalStorageStore = {};
  }),
};

describe('ConfiguracionEquiposView.vue - API Integration', () => {
  let wrapper;
  let originalLocalStorage;
  let alertSpy;

  const mockPartidaId = 'test-partida-123';

  beforeEach(() => {
    jest.clearAllMocks(); 
    localStorageMock.clear();

    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.setItem('partidaId', mockPartidaId);

    alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage });
    alertSpy.mockRestore();
    console.error.mockRestore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('debería guardar equipos, jugadores, partida y orden de turnos, y luego navegar a /palabras', async () => {
    axios.post = jest.fn()
      .mockResolvedValueOnce({ data: { id: 'equipoId1' } }) //POST /api/equipos
      .mockResolvedValueOnce({ data: { id: 'jugadorId1_1' } }) //POST /api/jugadores (Team 1, Player 1)
      .mockResolvedValueOnce({ data: { id: 'jugadorId1_2' } }) //POST /api/jugadores (Team 1, Player 2)
      .mockResolvedValueOnce({ data: { id: 'equipoId2' } }) //POST /api/equipos
      .mockResolvedValueOnce({ data: { id: 'jugadorId2_1' } }) //POST /api/jugadores (Team 2, Player 1)
      .mockResolvedValueOnce({ data: {} }); //POST /api/orden-turnos

    axios.put = jest.fn()
      .mockResolvedValueOnce({ data: {} }); //PUT /api/partidas/:id

    wrapper = mount(ConfiguracionEquiposView, {
      global: {
        stubs: { BasePage: { template: '<div><slot></slot></div>' } },
      },
    });

    const equipoInputs = wrapper.findAll('input.input-equipo');
    await equipoInputs.at(0).setValue('Equipo Uno');
    await equipoInputs.at(1).setValue('Equipo Dos');

    const addPlayerTeam1Button = wrapper.findAll('button.boton-integrante').at(0);
    await addPlayerTeam1Button.trigger('click');
    await flushPromises();

    const jugadorInputs = wrapper.findAll('input.input-jugador');
    await jugadorInputs.at(0).setValue('Jugador A1');
    await jugadorInputs.at(1).setValue('Jugador A2');
    await jugadorInputs.at(2).setValue('Jugador B1');

    const numeroPalabrasInput = wrapper.find('input.input-numero-palabras');
    await numeroPalabrasInput.setValue('5');

    await wrapper.find('img[alt="Empezar Partida"]').trigger('click');
    await flushPromises();

    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/equipos', {
      nombre: 'Equipo Uno',
      partida_id: mockPartidaId,
    });
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/equipos', {
      nombre: 'Equipo Dos',
      partida_id: mockPartidaId,
    });

    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/jugadores', {
      nombre: 'Jugador A1',
      equipo_id: 'equipoId1',
    });
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/jugadores', {
      nombre: 'Jugador A2',
      equipo_id: 'equipoId1',
    });
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/jugadores', {
      nombre: 'Jugador B1',
      equipo_id: 'equipoId2',
    });

    expect(axios.put).toHaveBeenCalledWith(
      `http://localhost:3000/api/partidas/${mockPartidaId}`,
      {
        numero_rondas: 5,
        tematicas: ["DESCRIBE LIBREMENTE", "DESCRIBE CON UNA PALABRA", "MÍMICA"],
        estado: "DESCRIBE LIBREMENTE",
      }
    );

    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/orden-turnos', {
      partida_id: mockPartidaId,
      orden: expect.arrayContaining([
        expect.objectContaining({ jugador_id: 'jugadorId1_1', equipo_id: 'equipoId1' }),
        expect.objectContaining({ jugador_id: 'jugadorId2_1', equipo_id: 'equipoId2' }),
        expect.objectContaining({ jugador_id: 'jugadorId1_2', equipo_id: 'equipoId1' }),
      ]),
    });

    expect(mockRouterPush).toHaveBeenCalledWith('/palabras');
    expect(alertSpy).not.toHaveBeenCalled();
  });

  it('debería mostrar alerta si un nombre de equipo está vacío y no hacer llamadas API', async () => {
    wrapper = mount(ConfiguracionEquiposView, {
      global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
    });

    const equipoInputs = wrapper.findAll('input.input-equipo');
    await equipoInputs.at(0).setValue('');
    await equipoInputs.at(1).setValue('Equipo Dos');

    const jugadorInputs = wrapper.findAll('input.input-jugador');
    await jugadorInputs.at(0).setValue('Jugador A1');
    await jugadorInputs.at(1).setValue('Jugador B1');

    await wrapper.find('img[alt="Empezar Partida"]').trigger('click');
    await flushPromises();

    expect(alertSpy).toHaveBeenCalledWith('El equipo 1 no tiene nombre.');
    expect(axios.post).not.toHaveBeenCalled();
    expect(axios.put).not.toHaveBeenCalled();
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});
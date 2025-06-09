import { mount, flushPromises } from '@vue/test-utils';
import PreJuegoView from '@/views/PreJuegoView.vue';
import axios from 'axios';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
  get: jest.fn(), 
}));

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
  removeItem: jest.fn(key => {
    delete mockLocalStorageStore[key];
  }),
  clear: jest.fn(() => {
    mockLocalStorageStore = {};
  }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('PreJuegoView.vue', () => {
  let wrapper;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.setItem('partidaId', 'test-partida-123');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  const mountComponentWithSuccessMocks = async (
    ordenTurnosData = [{ id: 'player1', nombre: 'Alice' }],
    partidaEstadoData = { estado: 'Mímica Extrema' }
  ) => {
    axios.get
      .mockResolvedValueOnce({ data: ordenTurnosData })
      .mockResolvedValueOnce({ data: partidaEstadoData });

    wrapper = mount(PreJuegoView, {
      global: {
        stubs: {
          BasePage: { template: '<div><slot></slot></div>' },
        },
      },
    });
    await flushPromises();
  };

  it('debería renderizar el título y texto inicial correctamente', async () => {
    await mountComponentWithSuccessMocks([], { estado: '' });

    expect(wrapper.find('h2.ronda-titulo').exists()).toBe(true);
    expect(wrapper.find('p.texto-jugador').text()).toBe('El primer jugador es...');
    expect(wrapper.find('img[alt="Empezar Partida"]').exists()).toBe(true);
  });

  it('debería obtener y mostrar el primer jugador y el nombre de la ronda en onMounted', async () => {
    const mockJugadores = [{ id: 'p1', nombre: 'JugadorUno' }, { id: 'p2', nombre: 'JugadorDos' }];
    const mockPartida = { estado: 'Describe la Palabra' };

    await mountComponentWithSuccessMocks(mockJugadores, mockPartida);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/orden-turnos/test-partida-123');
    expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/partidas/estado/test-partida-123');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('ordenTurnos', JSON.stringify(mockJugadores));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('indiceTurno', '0');
    expect(wrapper.vm.jugador.nombre).toBe('JugadorUno');
    expect(wrapper.vm.rondaNombre).toBe('Describe la Palabra');
    expect(wrapper.find('.ronda-titulo').text()).toBe('RONDA 1: Describe la Palabra');
    expect(wrapper.find('.nombre-jugador strong').text()).toBe('JugadorUno');
    expect(wrapper.html()).toContain('sólo <strong>JugadorUno</strong>');
  });

  it('debería manejar el caso donde no hay turnos definidos', async () => {
    await mountComponentWithSuccessMocks([], { estado: 'Ronda Inicial' });

    expect(wrapper.vm.jugador).toBe(null);
    const playerNameElement = wrapper.find('.nombre-jugador strong');
    expect(playerNameElement.exists()).toBe(true);
    expect(playerNameElement.text()).toBe('');
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith('indiceTurno', expect.anything());
    expect(wrapper.vm.rondaNombre).toBe('Ronda Inicial');
  });

  it('debería manejar errores al obtener datos en onMounted', async () => {
    const errorMessage = 'Error de red al cargar datos';
    axios.get.mockRejectedValue(new Error(errorMessage));

    wrapper = mount(PreJuegoView, {
      global: {
        stubs: {
          BasePage: { template: '<div><slot></slot></div>' },
        },
      },
    });
    await flushPromises();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error al obtener los datos de la partida o los turnos", expect.any(Error));
    expect(wrapper.vm.jugador).toBe(null);
    expect(wrapper.vm.rondaNombre).toBe('');
    const playerNameElement = wrapper.find('.nombre-jugador strong');
    expect(playerNameElement.exists()).toBe(true);
    expect(playerNameElement.text()).toBe('');
    expect(wrapper.find('.ronda-titulo').text()).toBe('RONDA 1:');
  });

  it('debería redirigir a /partida cuando se hace click en la imagen de empezar', async () => {
    await mountComponentWithSuccessMocks();

    const startGameImage = wrapper.find('img[alt="Empezar Partida"]');
    expect(startGameImage.exists()).toBe(true);
    await startGameImage.trigger('click');

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith('/partida');
  });

  it('no debería intentar obtener datos si partidaId no está en localStorage (y manejar errores)', async () => {
    localStorageMock.clear();

    const mockApiError = new Error('API call with null ID');
    axios.get.mockRejectedValueOnce(mockApiError);

    wrapper = mount(PreJuegoView, {
        global: {
        stubs: {
            BasePage: { template: '<div><slot></slot></div>' },
        },
        },
    });
    await flushPromises();

    expect(axios.get).toHaveBeenCalledWith('http://localhost:3000/api/orden-turnos/null');
    expect(axios.get).not.toHaveBeenCalledWith('http://localhost:3000/api/partidas/estado/null');
    expect(axios.get).toHaveBeenCalledTimes(1);

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error al obtener los datos de la partida o los turnos", mockApiError);
    expect(wrapper.vm.jugador).toBe(null);
    expect(wrapper.vm.rondaNombre).toBe('');
  });
});
import { mount, flushPromises } from '@vue/test-utils';
import ConfiguracionPalabrasView from '@/views/ConfiguracionPalabrasView.vue';
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

describe('ConfiguracionPalabrasView.vue - API Integration', () => {
  let wrapper;
  let originalLocalStorage;
  let consoleErrorSpy;

  const mockPartidaId = '1';

  const mockJugadoresDataFromBackend = [
    { jugador_id: 101, nombre: 'PlayerOne', equipo_id: 'eq1' },
    { jugador_id: 102, nombre: 'PlayerTwo', equipo_id: 'eq2' },
  ];
  const mockNumeroPalabrasFromBackend = { numero_palabras: 2 };

  beforeEach(async () => {
    jest.clearAllMocks();
    localStorageMock.clear();

    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    localStorageMock.setItem('partidaId', mockPartidaId);

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage });
    consoleErrorSpy.mockRestore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('debería cargar numeroPalabras y jugadores en onMounted y mostrar datos del primer jugador', async () => {
    wrapper = mount(ConfiguracionPalabrasView, {
      global: {
        stubs: { BasePage: { template: '<div><slot></slot></div>' } },
      },
    });

    console.log('[INTEGRATION TEST - ConfigPalabras] Waiting for onMounted API calls...');
    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 300));
    await flushPromises();
    console.log('[INTEGRATION TEST - ConfigPalabras] API calls should have completed.');

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    expect(wrapper.vm.numeroPalabras).toBeGreaterThanOrEqual(1);
    expect(wrapper.vm.jugadores.length).toBeGreaterThanOrEqual(1);

    if (wrapper.vm.jugadores.length > 0) {
      const expectedFirstPlayerName = wrapper.vm.jugadores[0].nombre;
      expect(wrapper.find('h3.nombre-jugador strong').text()).toBe(expectedFirstPlayerName);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('lastPlayedPlayerId', wrapper.vm.jugadores[0].jugador_id.toString());
    }

    const wordInputs = wrapper.findAll('input.input-equipo[type="text"]');
    expect(wordInputs.length).toBe(wrapper.vm.numeroPalabras);
  });

  it('debería guardar palabras para el jugador actual y pasar al siguiente jugador', async () => {
    axios.get = jest.fn()
      .mockResolvedValueOnce({ data: mockNumeroPalabrasFromBackend })
      .mockResolvedValueOnce({ data: mockJugadoresDataFromBackend });

    wrapper = mount(ConfiguracionPalabrasView, {
      global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
    });
    await flushPromises();

    expect(wrapper.vm.numeroPalabras).toBe(mockNumeroPalabrasFromBackend.numero_palabras);
    expect(wrapper.vm.jugadores.length).toBe(mockJugadoresDataFromBackend.length);
    expect(wrapper.find('h3.nombre-jugador strong').text()).toBe(mockJugadoresDataFromBackend[0].nombre);

    axios.post = jest.fn().mockResolvedValue({ data: { id: 'palabraSalvaId1' } });

    const wordInputs = wrapper.findAll('input.input-equipo[type="text"]');
    expect(wordInputs.length).toBe(mockNumeroPalabrasFromBackend.numero_palabras); //2

    await wordInputs.at(0).setValue('PalabraTest1');
    await wordInputs.at(1).setValue('PalabraTest2');

    await wrapper.find('img[alt="Empezar Partida"]').trigger('click');
    await flushPromises();

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/palabras', {
      texto: 'PalabraTest1',
      estado: 'pendiente',
      partida_id: mockPartidaId,
      equipo_id: mockJugadoresDataFromBackend[0].equipo_id,
    });
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/palabras', {
      texto: 'PalabraTest2',
      estado: 'pendiente',
      partida_id: mockPartidaId,
      equipo_id: mockJugadoresDataFromBackend[0].equipo_id,
    });

    expect(wrapper.vm.words).toEqual(['', '']);

    expect(wrapper.vm.currentIndex).toBe(1);
    expect(wrapper.find('h3.nombre-jugador strong').text()).toBe(mockJugadoresDataFromBackend[1].nombre); // Next player
  });

  it('debería redirigir a /prejuego después de que el último jugador introduzca palabras', async () => {
    const jugadoresParaTestFinal = [
        { jugador_id: 101, nombre: 'PlayerOne', equipo_id: 'eq1' },
        { jugador_id: 102, nombre: 'PlayerTwo', equipo_id: 'eq2' },
    ];
    axios.get = jest.fn()
      .mockResolvedValueOnce({ data: { numero_palabras: 1 } })
      .mockResolvedValueOnce({ data: jugadoresParaTestFinal });

    wrapper = mount(ConfiguracionPalabrasView, {
      global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
    });
    await flushPromises();

    wrapper.vm.currentIndex = jugadoresParaTestFinal.length - 1;
    await flushPromises();
    expect(wrapper.find('h3.nombre-jugador strong').text()).toBe(jugadoresParaTestFinal[1].nombre);

    axios.post = jest.fn().mockResolvedValue({ data: { id: 'palabraFinalId' } });

    await wrapper.find('input.input-equipo[type="text"]').setValue('UltimaPalabra');
    await wrapper.find('img[alt="Empezar Partida"]').trigger('click');
    await flushPromises();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith('/prejuego');
  });
});
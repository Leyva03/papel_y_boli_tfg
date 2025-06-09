import { mount, flushPromises } from '@vue/test-utils';
import PartidaView from '@/views/PartidaView.vue';
import axios from 'axios';

jest.mock('axios', () => ({
  __esModule: true,
  default: { 
    get: jest.fn(),
    put: jest.fn(),
  },
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
  setItem: jest.fn((key, value) => { mockLocalStorageStore[key] = value.toString(); }),
  clear: jest.fn(() => { mockLocalStorageStore = {}; }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true });

describe('PartidaView.vue', () => {
  let wrapper;
  let consoleErrorSpy;

  const MOCK_PARTIDA_ID = 'test-partida-id-123';
  const MOCK_JUGADORES = [
    { jugador_id: 1, nombre: 'Alice', equipo_id: 'e1' },
    { jugador_id: 2, nombre: 'Bob', equipo_id: 'e2' },
  ];
  const MOCK_PALABRAS = [
    { id: 'w1', texto: 'Manzana', estado: 'pendiente' },
    { id: 'w2', texto: 'Banana', estado: 'pendiente' },
  ];

  const mountComponent = async (palabrasData = MOCK_PALABRAS) => {
    axios.get 
      .mockResolvedValueOnce({ data: MOCK_JUGADORES }) //cargarJugadores
      .mockResolvedValueOnce({ data: palabrasData }) //cargarPalabras
      .mockResolvedValueOnce({ data: { cronometro_restante: 60 } }) //cargarCronometro
      .mockResolvedValueOnce({ data: { estado: 'MÍMICA' } }) //estado
      .mockResolvedValueOnce({ data: { tematicas: ['MÍMICA'] } }); //tematicas

    wrapper = mount(PartidaView, {
      global: {
        stubs: {
          BasePage: { template: '<div><slot></slot></div>' },
        },
      },
    });
    await flushPromises();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.setItem('partidaId', MOCK_PARTIDA_ID);
    localStorageMock.setItem('lastPlayedPlayerId', MOCK_JUGADORES[0].jugador_id.toString());
    jest.useFakeTimers();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.clearAllTimers();
    jest.useRealTimers();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('debería cargar datos iniciales desde el (mocked) API en onMounted y mostrar la información', async () => {
    await mountComponent();

    expect(axios.get).toHaveBeenCalledTimes(5);
    expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/orden-turnos/${MOCK_PARTIDA_ID}`);

    expect(wrapper.find('h3.nombre-jugador strong').text()).toBe('Alice');
    const displayedWord = wrapper.find('h3.ronda-titulo strong').text();
    expect(['Manzana', 'Banana']).toContain(displayedWord);
    expect(wrapper.find('.timer p strong').text()).toBe('60');
  });

  describe('Player Actions (Acierto / Pasar)', () => {
    beforeEach(async () => {
      await mountComponent();
      jest.spyOn(Math, 'random').mockReturnValue(0);
      wrapper.vm.changeWord();
      await flushPromises();
      
      axios.put.mockResolvedValue({ data: {} });
    });

    afterEach(() => {
      Math.random.mockRestore();
    });

    it('debería sumar 1 punto al equipo en un acierto', async () => {
      expect(wrapper.vm.word).toBe('Manzana');
      
      await wrapper.find('button.btn-acierto').trigger('click');
      await flushPromises();

      expect(axios.put).toHaveBeenCalledTimes(2);
      expect(axios.put).toHaveBeenCalledWith(`http://localhost:3000/api/palabras/w1`, { estado: 'acertada' });
      expect(axios.put).toHaveBeenCalledWith(`http://localhost:3000/api/equipos/e1`, { puntos: 1 });
    });

    it('debería restar 1 punto al equipo al pasar', async () => {
        expect(wrapper.vm.word).toBe('Manzana');

        await wrapper.find('button.btn-pasar').trigger('click');
        await flushPromises();

        expect(axios.put).toHaveBeenCalledTimes(2);
        expect(axios.put).toHaveBeenCalledWith(`http://localhost:3000/api/palabras/w1`, { estado: 'pasada' });
        expect(axios.put).toHaveBeenCalledWith(`http://localhost:3000/api/equipos/e1`, { puntos: -1 });
    });
  });

  describe('End of Turn/Round Navigation', () => {
    it('debería navegar a /resultados si no quedan palabras pendientes/pasadas y SÍ es la última ronda', async () => {
      axios.get
        .mockResolvedValueOnce({ data: MOCK_JUGADORES })
        .mockResolvedValueOnce({ data: [{ id: 'w1', texto: 'FinalWord', estado: 'pendiente' }] })
        .mockResolvedValueOnce({ data: { cronometro_restante: 60 } })
        .mockResolvedValueOnce({ data: { estado: 'MÍMICA' } })
        .mockResolvedValueOnce({ data: { tematicas: ['MÍMICA'] } });
      
      axios.put.mockResolvedValue({ data: {} }); //correctWord
      axios.get.mockResolvedValueOnce({ data: [] }); //checkForPendingOrPassedWords

      wrapper = mount(PartidaView);
      await flushPromises();

      await wrapper.find('button.btn-acierto').trigger('click');
      await flushPromises();

      expect(mockRouterPush).toHaveBeenCalledWith('/resultados');
    });
  });

  it('debería manejar un error de API durante onMounted', async () => {
    const mockApiError = new Error('API Failure');
    axios.get.mockRejectedValue(mockApiError); //

    wrapper = mount(PartidaView);
    await flushPromises();

    expect(consoleErrorSpy).toHaveBeenCalledWith("Error en cargarJugadores:", mockApiError);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error en PartidaView onMounted:", mockApiError);
    
    expect(wrapper.vm.jugadores.length).toBe(0);
    expect(wrapper.vm.rondaNombre).toBe('Error');
  });
});
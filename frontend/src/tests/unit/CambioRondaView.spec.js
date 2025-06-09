import { mount, flushPromises } from '@vue/test-utils';
import CambioRondaView from '@/views/CambioRondaView.vue';
import axios from 'axios';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
  get: jest.fn(),
  put: jest.fn(),
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
  clear: jest.fn(() => {
    mockLocalStorageStore = {};
  }),
  removeItem: jest.fn(key => {
    delete mockLocalStorageStore[key];
  }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('CambioRondaView.vue', () => {
  let wrapper;
  let consoleErrorSpy;

  const mockPartidaId = 'test-partida-cambio-ronda';
  const mockPlayersData = [
    { jugador_id: 1, nombre: 'Alice', equipo_id: '1' },
    { jugador_id: 2, nombre: 'Bob', equipo_id: '2' },
  ];
  const mockEquiposData = [
    { id: '1', nombre: 'Equipo Alpha', puntos: 10 },
    { id: '2', nombre: 'Equipo Beta', puntos: 8 },
  ];
  const mockPalabrasApiData = [
    { id: 'p1', texto: 'Sol', estado: 'acertada' },
    { id: 'p2', texto: 'Luna', estado: 'pendiente' },
    { id: 'p3', texto: 'Estrella', estado: 'pasada' },
  ];
  const mockTematicasData = { tematicas: ['DESCRIBE LIBREMENTE', 'DESCRIBE CON UNA PALABRA', 'MÍMICA'] };
  const mockEstadoInicialData = { estado: 'DESCRIBE LIBREMENTE' };

  const setupDefaultGetMocksForOnMounted = () => {
    axios.get
      .mockResolvedValueOnce({ data: mockPlayersData }) //cargarOrdenTurnos
      .mockResolvedValueOnce({ data: mockEquiposData }) //cargarPuntosEquipos
      .mockResolvedValueOnce({ data: mockPalabrasApiData }) //cargarPalabras
      .mockResolvedValueOnce({ data: mockTematicasData }) //cargarTematicas (tematicas)
      .mockResolvedValueOnce({ data: mockEstadoInicialData }); //cargarTematicas (estado)
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.setItem('partidaId', mockPartidaId);
    localStorageMock.setItem('lastPlayedPlayerId', mockPlayersData[0].jugador_id.toString());
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('debería cargar y mostrar datos correctamente en onMounted', async () => {
    setupDefaultGetMocksForOnMounted();
    wrapper = mount(CambioRondaView, {
      global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
    });
    await flushPromises();

    expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/orden-turnos/${mockPartidaId}`);
    expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/equipos/${mockPartidaId}`);
    expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/palabras/${mockPartidaId}`);
    expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/partidas/tematicas/${mockPartidaId}`);
    expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/partidas/estado/${mockPartidaId}`);

    expect(wrapper.find('.points').html()).toContain(`${mockEquiposData[0].nombre}:</strong> ${mockEquiposData[0].puntos}`);
    expect(wrapper.find('.points').html()).toContain(`${mockEquiposData[1].nombre}:</strong> ${mockEquiposData[1].puntos}`);

    expect(wrapper.find('.next-tematica p strong').text()).toBe('Siguiente Temática:');
    expect(wrapper.find('.next-tematica').html()).toContain(mockTematicasData.tematicas[1]); //DESCRIBE CON UNA PALABRA
    expect(wrapper.vm.siguienteTematica).toBe(mockTematicasData.tematicas[1]);

    expect(wrapper.find('.next-player').html()).toContain(mockPlayersData[1].nombre);
  });

  it('debería determinar la primera temática como siguiente si la actual es la última', async () => {
    const estadoUltimaRonda = { estado: mockTematicasData.tematicas[mockTematicasData.tematicas.length - 1] }; //MÍMICA
    axios.get
      .mockResolvedValueOnce({ data: mockPlayersData })
      .mockResolvedValueOnce({ data: mockEquiposData })
      .mockResolvedValueOnce({ data: mockPalabrasApiData })
      .mockResolvedValueOnce({ data: mockTematicasData })
      .mockResolvedValueOnce({ data: estadoUltimaRonda });

    wrapper = mount(CambioRondaView, { /* ...stubs... */ });
    await flushPromises();

    expect(wrapper.vm.siguienteTematica).toBe(mockTematicasData.tematicas[0]);
    expect(wrapper.find('.next-tematica').html()).toContain(mockTematicasData.tematicas[0]);
  });

  describe('goToNextTurn', () => {
    beforeEach(async () => {
        localStorageMock.setItem('partidaId', mockPartidaId);
        localStorageMock.setItem('lastPlayedPlayerId', mockPlayersData[0].jugador_id.toString());

        setupDefaultGetMocksForOnMounted();

        axios.get.mockResolvedValueOnce({ data: mockPalabrasApiData });

        axios.put.mockResolvedValue({ data: {} });

        wrapper = mount(CambioRondaView, {
            global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
        });
        await flushPromises(); //onMounted
        await new Promise(resolve => setTimeout(resolve, 0));
        await flushPromises();
    });

    it('debería actualizar lastPlayedPlayerId, estado de la partida, resetear palabras y navegar', async () => {
      const expectedNextPlayerId = mockPlayersData[1].jugador_id;
      const expectedSiguienteTematica = mockTematicasData.tematicas[1];

      await wrapper.find('img[alt="Continuar a la siguiente ronda"]').trigger('click');
      await flushPromises();

      expect(localStorageMock.setItem).toHaveBeenCalledWith('lastPlayedPlayerId', expectedNextPlayerId.toString());

      expect(axios.put).toHaveBeenCalledWith(
        `http://localhost:3000/api/partidas/siguiente-tematica/${mockPartidaId}`,
        {
          estado: expectedSiguienteTematica,
          tematicas: mockTematicasData.tematicas,
        }
      );
      const palabraAcertada = mockPalabrasApiData.find(p => p.estado === 'acertada'); //Sol
      expect(palabraAcertada).toBeDefined();
      expect(axios.put).toHaveBeenCalledWith(
        `http://localhost:3000/api/palabras/${palabraAcertada.id}`,
        { estado: 'pendiente' }
      );
      //Solo palabras acertadas se resetean (pasada y pendiente no)
      const palabraPasada = mockPalabrasApiData.find(p => p.estado === 'pasada');
      if (palabraPasada) {
         expect(axios.put).not.toHaveBeenCalledWith(
            `http://localhost:3000/api/palabras/${palabraPasada.id}`,
            { estado: 'pendiente' }
         );
      }
      expect(mockRouterPush).toHaveBeenCalledWith('/partida');
    });

    it('debería resetear solo las palabras acertadas', async () => {
      const palabrasConSoloUnaAcertada = [
        { id: '1', texto: 'Acertada1', estado: 'acertada' },
        { id: '2', texto: 'Pendiente1', estado: 'pendiente' },
        { id: '3', texto: 'Pasada1', estado: 'pasada' },
      ];

      axios.get.mockReset();

      axios.get
        .mockResolvedValueOnce({ data: mockPlayersData }) //orden-turnos
        .mockResolvedValueOnce({ data: mockEquiposData }) //equipos
        .mockResolvedValueOnce({ data: mockPalabrasApiData }) //actualizarEstadoPalabras en cargarPalabras
        .mockResolvedValueOnce({ data: mockPalabrasApiData.map(p => p.estado === 'pasada' ? {...p, estado: 'pendiente'} : p) }); //cargarPalabras

      axios.get.mockResolvedValueOnce({ data: palabrasConSoloUnaAcertada });

      axios.put.mockResolvedValue({ data: {} });

      localStorageMock.setItem('partidaId', mockPartidaId);
      localStorageMock.setItem('lastPlayedPlayerId', mockPlayersData[0].jugador_id.toString());

      wrapper = mount(CambioRondaView, {
        global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
      });
      await flushPromises(); //onMounted
      console.log('[TEST LOG] resetear - After onMounted, axios.get total calls:', axios.get.mock.calls.length); //4

      const calculatedSiguienteTematicaByComponent = wrapper.vm.siguienteTematica;
      const currentTematicasInComponent = wrapper.vm.tematicas;

      await wrapper.find('img[alt="Continuar a la siguiente ronda"]').trigger('click');
      await flushPromises();
      console.log('[TEST LOG] resetear - After goToNextTurn, axios.get total calls:', axios.get.mock.calls.length); //5
      console.log('[TEST LOG] resetear - After goToNextTurn, axios.put total calls:', axios.put.mock.calls.length); //2

      expect(axios.put).toHaveBeenCalledTimes(2);

      expect(axios.put).toHaveBeenCalledWith(
        `http://localhost:3000/api/partidas/siguiente-tematica/${mockPartidaId}`,
        {
          estado: calculatedSiguienteTematicaByComponent,
          tematicas: currentTematicasInComponent,
        }
      );
      expect(axios.put).toHaveBeenCalledWith(`http://localhost:3000/api/palabras/1`, { estado: 'pendiente' });
    });
  });

  it('debería manejar errores de API durante onMounted correctamente', async () => {
    axios.get.mockReset(); 

    axios.get.mockRejectedValue(new Error('Failed to fetch onMount'));
    localStorageMock.setItem('partidaId', mockPartidaId);
    localStorageMock.setItem('lastPlayedPlayerId', mockPlayersData[0].jugador_id.toString());

    wrapper = mount(CambioRondaView, {
      global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
    });
    await flushPromises(); 

    expect(consoleErrorSpy).toHaveBeenCalled(); 
    expect(wrapper.vm.equipos.length).toBe(0); 
    expect(wrapper.vm.siguienteTematica).toBe('');
    expect(wrapper.find('.next-player').html()).toContain('Cargando...'); 
  });
});
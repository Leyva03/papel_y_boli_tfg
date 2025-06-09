import { mount, flushPromises } from '@vue/test-utils';
import CambioTurnoView from '@/views/CambioTurnoView.vue';
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

describe('CambioTurnoView.vue', () => {
  let wrapper;
  let consoleErrorSpy;
  let consoleLogSpy;

  const mockPartidaId = 'test-partida-cambio-turno';
  const mockPlayersData = [
    { jugador_id: 1, nombre: 'Alice', equipo_id: '1' },
    { jugador_id: 2, nombre: 'Bob', equipo_id: '2' },
    { jugador_id: 3, nombre: 'Charlie', equipo_id: '2' },
  ];
  const mockEquiposData = [
    { id: '1', nombre: 'Equipo Alpha', puntos: 5 },
    { id: '2', nombre: 'Equipo Beta', puntos: 3 },
  ];
  const mockPalabrasApiData = [
    { id: '1', texto: 'Manzana', estado: 'pendiente' },
    { id: '2', texto: 'Banana', estado: 'pasada' },
    { id: '3', texto: 'Cereza', estado: 'acertada' },
    { id: '4', texto: 'Dátil', estado: 'pendiente' },
  ];

  const mountComponentWithDefaultMocks = async (
    players = mockPlayersData,
    equipos = mockEquiposData,
    palabrasInitial = mockPalabrasApiData,
    palabrasAfterUpdate = palabrasInitial.map(p => p.estado === 'pasada' ? {...p, estado: 'pendiente'} : p)
  ) => {
    localStorageMock.setItem('partidaId', mockPartidaId);
    localStorageMock.setItem('lastPlayedPlayerId', players[0].jugador_id.toString());


    axios.get
      .mockResolvedValueOnce({ data: players })
      .mockResolvedValueOnce({ data: equipos })
      .mockResolvedValueOnce({ data: palabrasInitial })
      .mockResolvedValueOnce({ data: palabrasAfterUpdate });

    axios.put.mockResolvedValue({ data: {} });

    wrapper = mount(CambioTurnoView, {
      global: {
        stubs: { BasePage: { template: '<div><slot></slot></div>' } },
      },
    });

    console.log('[TEST mountComponent] Before flushPromises');
    await flushPromises(); //onMounted
    await new Promise(resolve => setTimeout(resolve, 0));
    await flushPromises();
    console.log('[TEST mountComponent] After flushPromises');
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('debería cargar y mostrar datos correctamente en onMounted', async () => {
    await mountComponentWithDefaultMocks();

    expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/orden-turnos/${mockPartidaId}`); //cargarOrdenTurnos
    expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/equipos/${mockPartidaId}`); //cargarPuntosEquipos
    expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/palabras/${mockPartidaId}`);
    expect(axios.get.mock.calls.filter(call => call[0].includes('/api/palabras')).length).toBe(2);

    const pasadaWord = mockPalabrasApiData.find(p => p.texto === 'Banana');
    expect(axios.put).toHaveBeenCalledWith(`http://localhost:3000/api/palabras/${pasadaWord.id}`, { estado: 'pendiente' });

    const currentPlayerMessage = wrapper.findAll('p').find(p => p.text().includes('tu tiempo ha terminado.'));
    expect(currentPlayerMessage.exists()).toBe(true);
    expect(currentPlayerMessage.find('strong').text()).toBe(mockPlayersData[0].nombre);
    expect(currentPlayerMessage.text()).toBe(`${mockPlayersData[0].nombre} tu tiempo ha terminado.`);
    expect(wrapper.html()).toContain(`${mockEquiposData[0].nombre}:</strong> ${mockEquiposData[0].puntos}`);
    expect(wrapper.html()).toContain(`${mockEquiposData[1].nombre}:</strong> ${mockEquiposData[1].puntos}`);

    const expectedRemaining = mockPalabrasApiData.filter(p => p.estado === 'pendiente' || p.estado === 'pasada').length;
    expect(wrapper.vm.remainingWords.length).toBe(expectedRemaining);
    expect(wrapper.html()).toContain(`Palabras restantes:</strong> ${expectedRemaining} / ${mockPalabrasApiData.length}`);
    expect(wrapper.html()).toContain('Manzana');
    expect(wrapper.html()).toContain('Banana');
    expect(wrapper.html()).toContain('Dátil');
    expect(wrapper.html()).not.toContain('Cereza');


    expect(wrapper.find('.next-player').html()).toContain(mockPlayersData[1].nombre);
  });

  it('debería mostrar "Cargando..." si players.value está vacío para currentPlayer y nextPlayer', async () => {
    localStorageMock.setItem('partidaId', mockPartidaId);
    axios.get
      .mockResolvedValueOnce({ data: [] }) //cargarOrdenTurnos returns no players
      .mockResolvedValueOnce({ data: mockEquiposData })
      .mockResolvedValueOnce({ data: [] }) //actualizarEstadoPalabras (pasadas)
      .mockResolvedValueOnce({ data: [] }); //cargarPalabras

    wrapper = mount(CambioTurnoView, { /* ...stubs... */ });
    await flushPromises();

    expect(wrapper.html()).toContain(`<strong>Cargando...</strong> tu tiempo ha terminado.`);
    expect(wrapper.find('.next-player').html()).toContain('<strong>Cargando...</strong>');
  });


  it('debería actualizar lastPlayedPlayerId y navegar a /partida en goToNextTurn', async () => {
    await mountComponentWithDefaultMocks();

    const expectedNextPlayerId = mockPlayersData[1].jugador_id;

    await wrapper.find('img[alt="Continuar al siguiente jugador"]').trigger('click');

    expect(localStorageMock.setItem).toHaveBeenLastCalledWith('lastPlayedPlayerId', expectedNextPlayerId.toString());
    expect(mockRouterPush).toHaveBeenCalledWith('/partida');
  });

  it('debería ciclar al primer jugador en goToNextTurn si el actual es el último', async () => {
    localStorageMock.setItem('partidaId', mockPartidaId);
    localStorageMock.setItem('lastPlayedPlayerId', mockPlayersData[2].jugador_id.toString());

    axios.get
      .mockResolvedValueOnce({ data: mockPlayersData }) //cargarOrdenTurnos
      .mockResolvedValueOnce({ data: mockEquiposData }) //cargarPuntosEquipos
      .mockResolvedValueOnce({ data: [] }) //actualizarEstadoPalabras
      .mockResolvedValueOnce({ data: [] }); //cargarPalabras

    wrapper = mount(CambioTurnoView, { /* ...stubs... */ });
    await flushPromises();

    expect(wrapper.html()).toContain(`<strong>${mockPlayersData[2].nombre}</strong> tu tiempo ha terminado.`);
    expect(wrapper.find('.next-player').html()).toContain(mockPlayersData[0].nombre);


    const expectedNextPlayerIdAfterCycle = mockPlayersData[0].jugador_id;
    await wrapper.find('img[alt="Continuar al siguiente jugador"]').trigger('click');

    expect(localStorageMock.setItem).toHaveBeenLastCalledWith('lastPlayedPlayerId', expectedNextPlayerIdAfterCycle.toString());
    expect(mockRouterPush).toHaveBeenCalledWith('/partida');
  });

  it('debería manejar errores de API durante onMounted', async () => {
    localStorageMock.setItem('partidaId', mockPartidaId);
    axios.get.mockRejectedValue(new Error('Network Error'));

    wrapper = mount(CambioTurnoView, {
      global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
    });
    await flushPromises();

    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(wrapper.html()).toContain(`<strong>Cargando...</strong> tu tiempo ha terminado.`);
    expect(wrapper.vm.equipos.length).toBe(0);
    expect(wrapper.vm.remainingWords.length).toBe(0);
  });
});
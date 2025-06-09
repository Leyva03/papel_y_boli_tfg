import { mount, flushPromises } from '@vue/test-utils';
import ResultadosView from '@/views/ResultadosView.vue';
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
  clear: jest.fn(() => {
    mockLocalStorageStore = {};
  }),
  removeItem: jest.fn(key => {
    delete mockLocalStorageStore[key];
  }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ResultadosView.vue', () => {
  let wrapper;
  let consoleErrorSpy;

  const mockPartidaId = 'test-partida-resultados';
  const mockEquiposData = [
    { id: 'e1', nombre: 'Equipo Alpha', puntos: 15 },
    { id: 'e2', nombre: 'Equipo Beta', puntos: 20 }, //Winner
    { id: 'e3', nombre: 'Equipo Gamma', puntos: 10 },
  ];
  const mockEquiposDataTie = [
    { id: 'e1', nombre: 'Equipo Alpha', puntos: 20 }, //Tie
    { id: 'e2', nombre: 'Equipo Beta', puntos: 20 }, //Tie
    { id: 'e3', nombre: 'Equipo Gamma', puntos: 10 },
  ];

  const mountComponentWithMocks = async (equiposData = mockEquiposData) => {
    localStorageMock.setItem('partidaId', mockPartidaId);
    axios.get.mockResolvedValueOnce({ data: equiposData }); //cargarPuntosEquipos

    wrapper = mount(ResultadosView, {
      global: {
        stubs: { BasePage: { template: '<div><slot></slot></div>' } },
      },
    });
    await flushPromises(); //onMounted
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('debería cargar y mostrar los puntajes y el equipo ganador correctamente en onMounted', async () => {
    await mountComponentWithMocks();

    expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/equipos/${mockPartidaId}`);

    //Winner
    expect(wrapper.find('.winner h2 strong').text()).toBe('Equipo Beta');
    expect(wrapper.find('.winner h2').text()).toContain('con 20 puntos');
    expect(wrapper.vm.winner).toBe('Equipo Beta');
    expect(wrapper.vm.winnerPoints).toBe(20);

    //Scores
    const scoreListItems = wrapper.findAll('.team-scores ul li');
    expect(scoreListItems.length).toBe(3);
    expect(scoreListItems[0].text()).toBe('Equipo Alpha: 15 puntos');
    expect(scoreListItems[1].text()).toBe('Equipo Beta: 20 puntos');
    expect(scoreListItems[2].text()).toBe('Equipo Gamma: 10 puntos');
  });

  it('debería manejar un empate y mostrar al primer equipo empatado como ganador', async () => {
    await mountComponentWithMocks(mockEquiposDataTie);

    expect(wrapper.find('.winner h2 strong').text()).toBe('Equipo Alpha');
    expect(wrapper.find('.winner h2').text()).toContain('con 20 puntos');
    expect(wrapper.vm.winner).toBe('Equipo Alpha');
    expect(wrapper.vm.winnerPoints).toBe(20);
  });

  it('debería manejar el caso sin equipos (datos vacíos de API)', async () => {
    await mountComponentWithMocks([]);

    expect(axios.get).toHaveBeenCalledWith(`http://localhost:3000/api/equipos/${mockPartidaId}`);
    expect(wrapper.find('.winner').exists()).toBe(false);
    expect(wrapper.vm.winner).toBe('');
    expect(wrapper.find('.winner h2 strong').exists()).toBe(false);

    expect(wrapper.findAll('.team-scores ul li').length).toBe(0);
  });


  it('debería manejar errores de API durante onMounted (cargarPuntosEquipos)', async () => {
    localStorageMock.setItem('partidaId', mockPartidaId);
    axios.get.mockRejectedValueOnce(new Error('API Error al cargar equipos'));

    wrapper = mount(ResultadosView, {
      global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
    });
    await flushPromises();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cargar los puntos de los equipos:', expect.any(Error));
    expect(wrapper.vm.winner).toBe('');
    expect(wrapper.vm.winnerPoints).toBe(0);
    expect(Object.keys(wrapper.vm.scores).length).toBe(0);
    expect(wrapper.find('.winner h2 strong').exists()).toBe(false);
    expect(wrapper.findAll('.team-scores ul li').length).toBe(0);
  });

  it('debería redirigir a / al hacer click en "Volver a jugar"', async () => {
    await mountComponentWithMocks();

    await wrapper.find('img[alt="Volver a jugar"]').trigger('click');

    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith('/');
  });
});
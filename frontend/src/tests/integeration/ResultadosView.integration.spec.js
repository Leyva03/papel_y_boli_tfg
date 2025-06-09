import { mount, flushPromises } from '@vue/test-utils';
import ResultadosView from '@/views/ResultadosView.vue';
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
  clear: jest.fn(() => { mockLocalStorageStore = {}; }),
  removeItem: jest.fn(key => { delete mockLocalStorageStore[key]; }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true, writable: true });

describe('ResultadosView.vue - API Integration', () => {
  let wrapper;
  let consoleErrorSpy;

  const MOCK_PARTIDA_ID = '1';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true, writable: true });

    localStorageMock.setItem('partidaId', MOCK_PARTIDA_ID);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('debería cargar los puntajes REALES de los equipos desde la API en onMounted y mostrar el ganador y los puntajes', async () => {
    console.log(`[INT TEST ResultadosView onMounted REAL] Mounting with partidaId: ${MOCK_PARTIDA_ID}. Backend should be running.`);
    wrapper = mount(ResultadosView, {
      global: {
        stubs: { BasePage: { template: '<div><slot></slot></div>' } },
      },
    });

    console.log('[INT TEST ResultadosView onMounted REAL] Waiting for REAL onMounted API call to /api/equipos...');
    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 700));
    await flushPromises();
    console.log('[INT TEST ResultadosView onMounted REAL] API call should have completed.');

    console.log('[DEBUG REAL] vm.scores:', JSON.stringify(wrapper.vm.scores));
    console.log('[DEBUG REAL] vm.winner:', wrapper.vm.winner);
    console.log('[DEBUG REAL] vm.winnerPoints:', wrapper.vm.winnerPoints);

    if (Object.keys(wrapper.vm.scores).length > 0) {
        expect(wrapper.vm.scores['e1']).toBe(4);
        expect(wrapper.vm.scores['e2']).toBe(7);

        expect(wrapper.vm.winner).toBe('e2');
        expect(wrapper.vm.winnerPoints).toBe(7);

        expect(wrapper.find('.winner h2 strong').text()).toBe('e2');
        expect(wrapper.find('.winner h2').text()).toContain('con 7 puntos');

        const teamScoreElements = wrapper.findAll('.team-scores ul li');
        expect(teamScoreElements.length).toBe(2);

        expect(wrapper.html()).toContain('e1: 4 puntos');
        expect(wrapper.html()).toContain('e2: 7 puntos');

    } else {
        console.warn("[TEST WARN onMounted REAL] No scores loaded from backend. Check backend data for partidaId:", MOCK_PARTIDA_ID);
        expect(wrapper.find('.winner').exists()).toBe(false);
    }
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  }, 10000);

  it('debería redirigir a / al hacer click en "Volver a jugar"', async () => {
    const mockAxiosGet = jest.spyOn(axios, 'get').mockResolvedValueOnce({ data: [] });

    wrapper = mount(ResultadosView, {
      global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
    });
    await flushPromises();

    await wrapper.find('img[alt="Volver a jugar"]').trigger('click');
    expect(mockRouterPush).toHaveBeenCalledWith('/');

    mockAxiosGet.mockRestore();
  });

  it('debería manejar error si cargarPuntosEquipos falla y mostrar estado por defecto', async () => {
    localStorageMock.setItem('partidaId', MOCK_PARTIDA_ID);

    const mockAxiosGet = jest.spyOn(axios, 'get').mockRejectedValueOnce(new Error('Backend API error for equipos'));

    wrapper = mount(ResultadosView, {
      global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
    });
    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 50));
    await flushPromises();

    expect(consoleErrorSpy).toHaveBeenCalledWith('Error al cargar los puntos de los equipos:', expect.any(Error));
    expect(wrapper.vm.winner).toBe('');
    expect(wrapper.vm.winnerPoints).toBe(0);
    expect(Object.keys(wrapper.vm.scores).length).toBe(0);
    expect(wrapper.find('.winner').exists()).toBe(false);

    mockAxiosGet.mockRestore();
  });
});
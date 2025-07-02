import { mount, flushPromises } from '@vue/test-utils';
import PartidaView from '@/views/PartidaView.vue';

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
  removeItem: jest.fn(key => { delete mockLocalStorageStore[key]; }),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock, configurable: true, writable: true });

describe('PartidaView.vue - API Integration', () => {
  let wrapper;
  let consoleErrorSpy;

  const MOCK_PARTIDA_ID = '1';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.setItem('partidaId', MOCK_PARTIDA_ID);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('debería cargar datos REALES desde la API en onMounted y mostrar la información correcta', async () => {
    localStorageMock.setItem('lastPlayedPlayerId', '1');

    wrapper = mount(PartidaView, {
      global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
    });

    console.log('[INT TEST] Waiting for REAL onMounted API calls...');
    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 2000));
    await flushPromises();
    console.log('[INT TEST] API calls should have completed.');

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    expect(wrapper.vm.playerName).toBe("jug1");
    expect(wrapper.find('h3.nombre-jugador strong').text()).toBe('jug1');

    expect(wrapper.vm.words.length).toBe(0);
    expect(wrapper.vm.word).toBe('');

    expect(wrapper.vm.timer).toBeLessThanOrEqual(60);
    expect(wrapper.vm.timer).toBeGreaterThanOrEqual(58);
    expect(wrapper.find('.timer p strong').text()).toBe(String(wrapper.vm.timer));

    expect(wrapper.vm.rondaNombre).toBe('MÍMICA');
    expect(wrapper.find('p').text()).toContain('RONDA: MÍMICA');
    expect(wrapper.vm.tematicas).toEqual(["DESCRIBE LIBREMENTE", "DESCRIBE CON UNA PALABRA", "MÍMICA"]);
  }, 20000);
});
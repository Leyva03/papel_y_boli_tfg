import { mount, flushPromises } from '@vue/test-utils';
import CambioRondaView from '@/views/CambioRondaView.vue';
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

describe('CambioRondaView.vue - API Integration', () => {
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
    if (wrapper) {
      wrapper.unmount();
    }
    jest.restoreAllMocks();
  });

  it('debería cargar datos REALES desde la API en onMounted y mostrar la información correcta', async () => {
    localStorageMock.setItem('lastPlayedPlayerId', '1');

    const mockPutSpy = jest.spyOn(axios, 'put').mockResolvedValue({ data: {} });

    wrapper = mount(CambioRondaView, {
      global: { stubs: { BasePage: { template: '<div><slot></slot></div>' } } },
    });

    console.log('[INT TEST] Waiting for REAL onMounted API calls...');
    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 1500));
    await flushPromises();
    console.log('[INT TEST] API calls should have completed.');

    expect(wrapper.vm.players.length).toBe(2);
    expect(wrapper.vm.equipos.length).toBe(2);
    expect(wrapper.vm.totalWords).toBe(6);
    expect(wrapper.vm.remainingWords.length).toBe(0);
    expect(wrapper.vm.siguienteTematica).toBe("DESCRIBE LIBREMENTE"); 

    expect(mockPutSpy).not.toHaveBeenCalled();

    expect(wrapper.html()).toContain('<strong>e1:</strong> 4');
    expect(wrapper.html()).toContain('<strong>e2:</strong> 7');
    expect(wrapper.html()).toContain('<strong>Siguiente Temática:</strong> DESCRIBE LIBREMENTE');
    expect(wrapper.find('.next-player').html()).toContain('<strong>jug2</strong>');

    expect(consoleErrorSpy).not.toHaveBeenCalled();
  }, 15000);
});
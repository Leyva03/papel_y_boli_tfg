import { mount, flushPromises } from '@vue/test-utils';
import PreJuegoView from '@/views/PreJuegoView.vue';

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

describe('PreJuegoView.vue - API Integration', () => {
  let wrapper;
  let originalLocalStorage;
  let consoleErrorSpy;

  const partidaIdParaTest = '1';

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    localStorageMock.setItem('partidaId', partidaIdParaTest);
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', { value: originalLocalStorage });
    consoleErrorSpy.mockRestore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('debería obtener datos de la API en onMounted y mostrar la información del primer jugador y la ronda', async () => {

    wrapper = mount(PreJuegoView, {
      global: {
        stubs: { BasePage: { template: '<div><slot></slot></div>' } }
      }
    });

    console.log('[INTEGRATION TEST - PreJuegoView] Waiting for onMounted API calls...');
    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 300));
    await flushPromises();
    console.log('[INTEGRATION TEST - PreJuegoView] API calls should have completed.');

    expect(consoleErrorSpy).not.toHaveBeenCalled();

    expect(localStorageMock.setItem).toHaveBeenCalledWith('ordenTurnos', expect.any(String));
    expect(localStorageMock.setItem).toHaveBeenCalledWith('indiceTurno', '0');

    expect(wrapper.vm.jugador).not.toBeNull();
    if (wrapper.vm.jugador) {
      expect(typeof wrapper.vm.jugador.nombre).toBe('string');
      console.log('[INTEGRATION TEST - PreJuegoView] Jugador Cargado:', wrapper.vm.jugador.nombre);
      expect(wrapper.find('h3.nombre-jugador strong').text()).toBe(wrapper.vm.jugador.nombre);
    }

    expect(wrapper.vm.rondaNombre).not.toBe('');
    console.log('[INTEGRATION TEST - PreJuegoView] Ronda Cargada:', wrapper.vm.rondaNombre);
    expect(wrapper.find('h2.ronda-titulo').text()).toContain(wrapper.vm.rondaNombre);

    await wrapper.find('img[alt="Empezar Partida"]').trigger('click');
    expect(mockRouterPush).toHaveBeenCalledWith('/partida');
  });
});
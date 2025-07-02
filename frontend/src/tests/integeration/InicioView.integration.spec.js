import { mount, flushPromises } from '@vue/test-utils';
import InicioView from '@/views/InicioView.vue';

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

describe('InicioView.vue - API Integration', () => {
  let wrapper;
  let originalLocalStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();

    originalLocalStorage = window.localStorage;
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    });
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(window, 'localStorage', {
      value: originalLocalStorage,
    });
    console.error.mockRestore(); 
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('debería crear una nueva partida a través de la API y redirigir', async () => {
    wrapper = mount(InicioView, {
      global: {
      }
    });

    const startGameImage = wrapper.find('img[alt="Empezar Partida"]');
    expect(startGameImage.exists()).toBe(true);
    await startGameImage.trigger('click');

    await flushPromises();
    await new Promise(resolve => setTimeout(resolve, 200));
    await flushPromises();

    expect(localStorageMock.setItem).toHaveBeenCalledWith('partidaId', expect.any(String));

    expect(mockRouterPush).toHaveBeenCalledWith('/configuracion');

    if (localStorageMock.setItem.mock.calls.length > 0) {
      const lastCallArgs = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1];
      expect(lastCallArgs[0]).toBe('partidaId');
      const partidaIdFromStorage = lastCallArgs[1];
      expect(partidaIdFromStorage).toMatch(/^\d+$/);
    }
  });
});
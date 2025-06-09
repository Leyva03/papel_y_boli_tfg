import { mount, flushPromises } from '@vue/test-utils';
import ConfiguracionPalabrasView from '@/views/ConfiguracionPalabrasView.vue';
import axios from 'axios';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
  get: jest.fn(),
  post: jest.fn(),
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
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ConfiguracionPalabrasView.vue', () => {
  let wrapper;
  let consoleErrorSpy;

  const mockJugadoresData = [
    { jugador_id: 'j1', equipo_id: 'e1', nombre: 'Alice' },
    { jugador_id: 'j2', equipo_id: 'e2', nombre: 'Bob' },
  ];
  const mockNumeroPalabrasData = { numero_palabras: 2 };

  const mountComponentWithSuccessMocks = async (
    jugadoresData = mockJugadoresData,
    numeroPalabrasData = mockNumeroPalabrasData
  ) => {
    axios.get
      .mockResolvedValueOnce({ data: numeroPalabrasData }) //numero-palabras
      .mockResolvedValueOnce({ data: jugadoresData }); //orden-turnos

    wrapper = mount(ConfiguracionPalabrasView, {
      global: {
        stubs: {
          BasePage: { template: '<div><slot></slot></div>' },
        },
      },
    });
    await flushPromises(); //onMounted
  };

  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.clear();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    localStorageMock.setItem('partidaId', 'test-partida-config-palabras');
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    if (wrapper) {
      wrapper.unmount();
    }
  });

  it('debería renderizar el nombre del primer jugador y el número correcto de campos de palabras en onMounted', async () => {
    await mountComponentWithSuccessMocks();

    expect(wrapper.find('h3.nombre-jugador strong').text()).toBe(mockJugadoresData[0].nombre);
    const wordInputs = wrapper.findAll('input.input-equipo[type="text"]');
    expect(wordInputs.length).toBe(mockNumeroPalabrasData.numero_palabras);
    expect(wrapper.find('label[for="word1"]').text()).toBe('Palabra 1:');
    expect(wrapper.find('label[for="word2"]').text()).toBe('Palabra 2:');
  });

  it('debería actualizar words ref cuando se escribe en los campos de entrada', async () => {
    await mountComponentWithSuccessMocks();

    const wordInputs = wrapper.findAll('input.input-equipo[type="text"]');
    await wordInputs.at(0).setValue('PalabraUno');
    await wordInputs.at(1).setValue('PalabraDos');

    expect(wrapper.vm.words[0]).toBe('PalabraUno');
    expect(wrapper.vm.words[1]).toBe('PalabraDos');
  });

  it('debería llamar a localStorage.setItem para lastPlayedPlayerId en onMounted si hay jugadores', async () => {
    await mountComponentWithSuccessMocks();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('lastPlayedPlayerId', mockJugadoresData[0].jugador_id);
  });

  it('NO debería llamar a localStorage.setItem para lastPlayedPlayerId si no hay jugadores', async () => {
    await mountComponentWithSuccessMocks([], mockNumeroPalabrasData); //No jugadores
    expect(localStorageMock.setItem).not.toHaveBeenCalledWith('lastPlayedPlayerId', expect.anything());
  });

  it('debería guardar palabras y pasar al siguiente jugador al hacer click en el botón', async () => {
    await mountComponentWithSuccessMocks();
    axios.post.mockResolvedValue({ data: { id: 'palabraGuardadaId' } });

    const wordInputs = wrapper.findAll('input.input-equipo[type="text"]');
    await wordInputs.at(0).setValue('TestWord1');
    await wordInputs.at(1).setValue('TestWord2');

    await wrapper.find('img[alt="Empezar Partida"]').trigger('click');
    await flushPromises();

    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/palabras', {
      texto: 'TestWord1',
      estado: 'pendiente',
      partida_id: 'test-partida-config-palabras',
      equipo_id: mockJugadoresData[0].equipo_id,
    });
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/palabras', {
      texto: 'TestWord2',
      estado: 'pendiente',
      partida_id: 'test-partida-config-palabras',
      equipo_id: mockJugadoresData[0].equipo_id,
    });

    //Palabras borradas para el siguiente jugador
    expect(wrapper.vm.words).toEqual(['', '']);

    //Jugador actualizado
    expect(wrapper.vm.currentIndex).toBe(1);
    expect(wrapper.find('h3.nombre-jugador strong').text()).toBe(mockJugadoresData[1].nombre);
  });

  it('no debería guardar palabras vacías o solo con espacios', async () => {
    await mountComponentWithSuccessMocks();
    axios.post.mockResolvedValue({ data: { id: 'palabraGuardadaId' } });

    const wordInputs = wrapper.findAll('input.input-equipo[type="text"]');
    await wordInputs.at(0).setValue('ValidWord');
    await wordInputs.at(1).setValue('   ');

    await wrapper.find('img[alt="Empezar Partida"]').trigger('click');
    await flushPromises();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/palabras', expect.objectContaining({
      texto: 'ValidWord',
    }));
    expect(axios.post).not.toHaveBeenCalledWith('http://localhost:3000/api/palabras', expect.objectContaining({
      texto: '   ',
    }));
  });

  it('debería redirigir a /prejuego después de que el último jugador introduzca palabras', async () => {
    const singlePlayerData = [{ jugador_id: 'jLast', equipo_id: 'eLast', nombre: 'LastPlayer' }];
    await mountComponentWithSuccessMocks(singlePlayerData, { numero_palabras: 1 });
    axios.post.mockResolvedValue({ data: { id: 'palabraGuardadaId' } });

    await wrapper.find('input.input-equipo[type="text"]').setValue('FinalWord');
    await wrapper.find('img[alt="Empezar Partida"]').trigger('click');
    await flushPromises();

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).toHaveBeenCalledWith('/prejuego');
  });

  it('debería usar 3 como numeroPalabras por defecto si la API no devuelve valor', async () => {
    axios.get
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: mockJugadoresData });

    wrapper = mount(ConfiguracionPalabrasView, {
      global: {
        stubs: { BasePage: { template: '<div><slot></slot></div>' } },
      },
    });
    await flushPromises();

    expect(wrapper.vm.numeroPalabras).toBe(3);
    expect(wrapper.findAll('input.input-equipo[type="text"]').length).toBe(3);
  });

  it('debería manejar errores de API en onMounted y no cambiar datos', async () => {
    const mockApiError = new Error('API Error onMount');
    axios.get.mockRejectedValue(mockApiError);

    wrapper = mount(ConfiguracionPalabrasView, {
        global: {
        stubs: { BasePage: { template: '<div><slot></slot></div>' } },
        },
    });
    await flushPromises();

    expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith("Error al cargar datos iniciales de configuración de palabras:", mockApiError);

    expect(wrapper.vm.numeroPalabras).toBe(3);
    expect(wrapper.vm.jugadores.length).toBe(0);
    expect(wrapper.find('h3.nombre-jugador strong').exists()).toBe(false);
  });
});
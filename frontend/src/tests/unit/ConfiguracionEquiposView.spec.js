import { mount } from '@vue/test-utils'
import ConfiguracionEquiposView from '@/views/ConfiguracionEquiposView.vue'
import axios from 'axios'

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    put: jest.fn(),
  },
}))

const mockPush = jest.fn()
jest.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

const localStorageMock = (function() {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value.toString(); }),
    clear: jest.fn(() => { store = {}; })
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ConfiguracionEquiposView.vue', () => {
  let wrapper
  let alertMock 
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.clear()
    localStorage.setItem('partidaId', 'test-partida-id')

    axios.post.mockResolvedValue({ data: { id: 1 } })
    axios.put.mockResolvedValue({ data: {} })

    alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    wrapper = mount(ConfiguracionEquiposView)
  })

  afterEach(() => {
    alertMock.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  it('debería renderizar el componente correctamente', () => {
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.findAll('.input-equipo').length).toBe(2)
    expect(wrapper.findAll('.input-jugador').length).toBe(2)
    expect(wrapper.find('input[type="number"]').element.value).toBe('3')
  })

  it('debería añadir un nuevo equipo al hacer click en "Añadir equipo"', async () => {
    await wrapper.find('.boton-equipo').trigger('click')
    expect(wrapper.findAll('.input-equipo').length).toBe(3)
  })

  it('debería eliminar el último equipo al hacer click en "Eliminar último" si hay 3 o más equipos', async () => {
    await wrapper.find('.boton-equipo').trigger('click') //3 teams
    await wrapper.find('.boton-equipo').trigger('click') //4 teams
    expect(wrapper.findAll('.input-equipo').length).toBe(4)

    await wrapper.find('.boton-eliminar-equipo').trigger('click')
    expect(wrapper.findAll('.input-equipo').length).toBe(3)
  })

  it('NO debería eliminar el último equipo si hay menos de 3 equipos', async () => {
    expect(wrapper.findAll('.input-equipo').length).toBe(2)
    expect(wrapper.find('.boton-eliminar-equipo').exists()).toBe(false);

    await wrapper.find('.boton-equipo').trigger('click')
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.input-equipo').length).toBe(3)
    expect(wrapper.find('.boton-eliminar-equipo').exists()).toBe(true); //Botón visible

    await wrapper.find('.boton-eliminar-equipo').trigger('click')
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.input-equipo').length).toBe(2) //2 teams

    expect(wrapper.find('.boton-eliminar-equipo').exists()).toBe(false);
  })


  it('debería añadir un jugador a un equipo', async () => {
    const primerEquipoAddButton = wrapper.findAll('.boton-integrante').at(0)
    await primerEquipoAddButton.trigger('click')
    expect(wrapper.findAll('.input-jugador').length).toBe(3) //+ 1 nuevo
    expect(wrapper.findAll('.eliminar-jugador').length).toBe(3) //+ 1 nuevo
  })

  it('NO debería añadir más de 5 jugadores por equipo', async () => {
    const firstTeamSection = wrapper.findAll('div.mb-6').at(0);

    for (let i = 0; i < 4; i++) { //Añadir 4 jugadores (5 total)
        const addButton = firstTeamSection.find('.boton-integrante');
        expect(addButton.exists()).toBe(true);
        await addButton.trigger('click');
        await wrapper.vm.$nextTick();
    }
    await wrapper.vm.$nextTick();

    //Desaparece el botón al haber añadido 4 jugadores (5 total)
    const addButtonAfterMax = firstTeamSection.find('.boton-integrante');
    expect(addButtonAfterMax.exists()).toBe(false);

    expect(wrapper.findAll('.input-jugador').length).toBe(6); //5 para team 1 + 1 para team 2
  });

  it('debería eliminar un jugador de un equipo', async () => {
    await wrapper.findAll('.boton-integrante').at(0).trigger('click')
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.input-jugador').length).toBe(3) //+ 1

    const primerJugadorEliminarButton = wrapper.findAll('.eliminar-jugador').at(0)
    await primerJugadorEliminarButton.trigger('click')
    await wrapper.vm.$nextTick();
    expect(wrapper.findAll('.input-jugador').length).toBe(2) //3 - 1 = 2
  })

  it('debería actualizar el nombre del equipo y del jugador al escribir', async () => {
    const primerEquipoInput = wrapper.findAll('.input-equipo').at(0)
    await primerEquipoInput.setValue('Los Leones')
    expect(wrapper.vm.equipos[0].nombre).toBe('Los Leones')

    const primerJugadorInput = wrapper.findAll('.input-jugador').at(0)
    await primerJugadorInput.setValue('Juan')
    expect(wrapper.vm.equipos[0].jugadores[0]).toBe('Juan')

    const numeroPalabrasInput = wrapper.find('input[type="number"]')
    await numeroPalabrasInput.setValue(5)
    expect(wrapper.vm.numeroPalabras).toBe(5)
  })

  describe('guardarTodo', () => {
    beforeEach(() => {
    });
    afterEach(() => {
    });

    it('debería mostrar alerta si un equipo no tiene nombre', async () => {
        //Primer equipo sin nombre
        await wrapper.findAll('.input-equipo').at(0).setValue('')
        await wrapper.vm.$nextTick();

        await wrapper.find('img[alt="Empezar Partida"]').trigger('click') //Click "Guardar todo"
        await wrapper.vm.$nextTick();

        expect(alertMock).toHaveBeenCalledWith('El equipo 1 no tiene nombre.')
        expect(axios.post).not.toHaveBeenCalled() //No API calls
        expect(mockPush).not.toHaveBeenCalled() //No redireccion
    })

    it('debería mostrar alerta si un equipo no tiene jugadores', async () => {
      await wrapper.findAll('.input-equipo').at(0).setValue('Equipo A');
      await wrapper.findAll('.input-equipo').at(1).setValue('Equipo B');
      await wrapper.vm.$nextTick();

      const firstTeamSection = wrapper.findAll('div.mb-6').at(0);

      let deleteButtonsInTeam1 = firstTeamSection.findAll('.eliminar-jugador');
      while (deleteButtonsInTeam1.length > 0) {
          await deleteButtonsInTeam1.at(0).trigger('click');
          await wrapper.vm.$nextTick();
          deleteButtonsInTeam1 = firstTeamSection.findAll('.eliminar-jugador');
      }

      expect(firstTeamSection.find('.input-jugador').exists()).toBe(false);

      await wrapper.find('img[alt="Empezar Partida"]').trigger('click');
      await wrapper.vm.$nextTick();

      expect(alertMock).toHaveBeenCalledWith('El equipo 1 no tiene jugadores.');
      expect(axios.post).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    })

    it('debería mostrar alerta si un jugador tiene nombre vacío', async () => {
      await wrapper.findAll('.input-equipo').at(0).setValue('Equipo A')
      await wrapper.findAll('.input-equipo').at(1).setValue('Equipo B')
      await wrapper.vm.$nextTick();

      await wrapper.findAll('.input-jugador').at(0).setValue('');
      await wrapper.vm.$nextTick();

      await wrapper.find('img[alt="Empezar Partida"]').trigger('click')
      await wrapper.vm.$nextTick();
      expect(alertMock).toHaveBeenCalledWith('Hay jugadores sin nombre en el equipo 1.')
      expect(axios.post).not.toHaveBeenCalled()
      expect(mockPush).not.toHaveBeenCalled()
    })

    it('debería guardar la configuración y redirigir a /palabras en caso de éxito', async () => {
      await wrapper.findAll('.input-equipo').at(0).setValue('Team Red')
      await wrapper.findAll('.input-jugador').at(0).setValue('Alice')

      await wrapper.findAll('.input-equipo').at(1).setValue('Team Blue')
      await wrapper.findAll('.input-jugador').at(1).setValue('Bob')

      await wrapper.find('.input-numero-palabras').setValue(5)
      await wrapper.vm.$nextTick();

      axios.post
        .mockResolvedValueOnce({ data: { id: 'equipo-red-id' } }) //Team Red
        .mockResolvedValueOnce({ data: { id: 'alice-id' } }) //Alice
        .mockResolvedValueOnce({ data: { id: 'equipo-blue-id' } }) //Team Blue
        .mockResolvedValueOnce({ data: { id: 'bob-id' } }) //Bob
        .mockResolvedValueOnce({ data: {} }); //orden-turnos post

      axios.put.mockResolvedValueOnce({ data: {} }) //partida update

      await wrapper.find('img[alt="Empezar Partida"]').trigger('click') //Click "Guardar todo"
      await new Promise(resolve => setTimeout(resolve, 100));
      await wrapper.vm.$nextTick();

      expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/equipos', { nombre: 'Team Red', partida_id: 'test-partida-id' })
      expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/equipos', { nombre: 'Team Blue', partida_id: 'test-partida-id' })

      expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/jugadores', { nombre: 'Alice', equipo_id: 'equipo-red-id' })
      expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/jugadores', { nombre: 'Bob', equipo_id: 'equipo-blue-id' })

      expect(axios.put).toHaveBeenCalledWith(`http://localhost:3000/api/partidas/test-partida-id`, {
        numero_rondas: 5,
        tematicas: ["DESCRIBE LIBREMENTE", "DESCRIBE CON UNA PALABRA", "MÍMICA"],
        estado: "DESCRIBE LIBREMENTE"
      })

      expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/orden-turnos', expect.any(Object))

      expect(mockPush).toHaveBeenCalledWith('/palabras')
    })

    it('debería manejar errores de API durante el proceso de guardado', async () => {
      await wrapper.findAll('.input-equipo').at(0).setValue('Team Red');
      await wrapper.findAll('.input-jugador').at(0).setValue('Alice');
      await wrapper.findAll('.input-equipo').at(1).setValue('Team Blue');
      await wrapper.findAll('.input-jugador').at(1).setValue('Bob');
      await wrapper.vm.$nextTick();

      const mockError = new Error('Network Error during team creation');
      axios.post.mockRejectedValueOnce(mockError);

      wrapper.find('img[alt="Empezar Partida"]').trigger('click');

      await new Promise(resolve => setTimeout(resolve, 0));
      await wrapper.vm.$nextTick();

      expect(alertMock).toHaveBeenCalledWith('Error al iniciar la partida. Intenta de nuevo.');
      expect(consoleErrorSpy).toHaveBeenCalledWith('Error al crear la partida', mockError);
      expect(mockPush).not.toHaveBeenCalled();
    });
  })
})
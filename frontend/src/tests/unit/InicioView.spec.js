import { shallowMount } from '@vue/test-utils'
import InicioView from '@/views/InicioView.vue'
import axios from 'axios'

jest.mock('axios')

const mockPush = jest.fn()
jest.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('InicioView.vue', () => {
  let wrapper

  beforeEach(() => {
    jest.clearAllMocks()
    wrapper = shallowMount(InicioView)
  })

  it('debería renderizar el componente correctamente', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('debería llamar a la función "empezar" y realizar la redirección cuando se hace click en la imagen', async () => {
    axios.post.mockResolvedValue({ data: { id: 1 } })
    Storage.prototype.setItem = jest.fn()

    await wrapper.find('img').trigger('click')

    expect(axios.post).toHaveBeenCalledWith('http://localhost:3000/api/partidas', expect.any(Object))
    expect(localStorage.setItem).toHaveBeenCalledWith('partidaId', '1')
    expect(mockPush).toHaveBeenCalledWith('/configuracion')
  })

  it('debería mostrar un mensaje de error si la creación de la partida falla', async () => {
    axios.post.mockRejectedValue(new Error('Error al crear la partida'))
    global.alert = jest.fn()

    await wrapper.find('img').trigger('click')

    expect(global.alert).toHaveBeenCalledWith('Error al iniciar la partida. Intenta de nuevo.')
  })
})

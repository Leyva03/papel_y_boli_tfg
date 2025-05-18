<template>
  <p>Ronda: {{ round }}</p>
  <BasePage title="TURNO DE:">
    <div class="space-y-4">
      <h3><strong>{{ playerName}}</strong></h3>

      <p>La palabra es...</p>
      <h3><strong>{{ word }}</strong></h3>

      <!-- Cronómetro -->
      <div class="timer">
        <p><strong>{{ timer }}</strong> segundos</p>
        <div>
          <!-- Botón para editar el cronómetro -->
          <button @click="editTimer" class="btn btn-secondary">Editar Tiempo</button>
          <div v-if="isEditing">
            <input v-model="editedTime" type="number" class="input" min="1" />
            <button @click="saveEdit" class="btn btn-primary">Guardar</button>
          </div>
          <button @click="pauseTimer" class="btn btn-warning" :disabled="isPaused">Pausar</button>
          <button @click="resumeTimer" class="btn btn-success" :disabled="!isPaused">Reanudar</button>
          <button @click="resetTimer" class="btn btn-danger">Reiniciar</button>
        </div>
      </div>

      <!-- Botones de puntuación -->
      <div class="buttons">
        <button @click="correctWord" class="btn btn-success">Acierto (+1)</button>
        <button @click="passWord" class="btn btn-danger">Pasar (-1)</button>
      </div>
    </div>
  </BasePage>
</template>

<script setup>
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import axios from 'axios'
  import BasePage from '../components/base/BasePage.vue'

  const router = useRouter()
  const partidaId = localStorage.getItem('partidaId') //ID de la partida
  const currentPlayerIndex = ref(0) //Índice del jugador activo
  const jugadores = ref([]) //Lista de jugadores
  const words = ref([]) //Lista de palabras
  const word = ref('') //Palabra actual
  const timer = ref(10) //Cronómetro
  let interval = null //Variable para el setInterval
  const round = ref(1) //Ronda actual
  const tematicas = ref([]) //Temáticas de la partida
  const estadoActual = ref('') //Estado actual de la partida
  const isPaused = ref(false) //Estado de pausa del cronómetro
  const isEditing = ref(false) //Estado de edición
  const editedTime = ref(30) //Tiempo editado por el jugador
  
  //Obtener el jugador actual
  const currentPlayer = computed(() => {
    const currentPlayerId = localStorage.getItem('lastPlayedPlayerId')
    return jugadores.value.find(jugador => jugador.jugador_id === Number(currentPlayerId))
  })  
  
  //Obtener el nombre del jugador actual
  const playerName = computed(() => {
    // Recuperamos el jugador actual desde localStorage
    const currentPlayerId = localStorage.getItem('lastPlayedPlayerId')
    const player = jugadores.value.find(jugador => jugador.jugador_id === Number(currentPlayerId))
    return player ? player.nombre : 'Cargando...'
  })  

  //Función para iniciar el cronómetro
  const startTimer = () => {
    if (interval) clearInterval(interval)
    interval = setInterval(() => {
      if (timer.value > 0 && !isPaused.value) {
        timer.value -= 1
      } else if (timer.value === 0) {
        clearInterval(interval)
        checkForPendingOrPassedWords()
      }
    }, 1000)
  }

  //Función para pausar el cronómetro
  const pauseTimer = () => {
    isPaused.value = true
    clearInterval(interval)
  }

  //Función para reanudar el cronómetro
  const resumeTimer = () => {
    isPaused.value = false
    startTimer()
  }

  //Función para reiniciar el cronómetro
  const resetTimer = () => {
    timer.value = editedTime.value
    isPaused.value = false
    startTimer()
  }

  //Función para editar el cronómetro
  const editTimer = () => {
    isEditing.value = true
  }

  //Función para guardar el tiempo editado
  const saveEdit = () => {
    timer.value = editedTime.value
    isEditing.value = false
    startTimer()
  }

  //Función para cargar el cronómetro desde la base de datos
  const cargarCronometro = async () => {
    const res = await axios.get(`http://localhost:3000/api/partidas/cronometro_restante/${partidaId}`)
    const cronometroRestante = res.data.cronometro_restante || 30
    timer.value = cronometroRestante
    editedTime.value = cronometroRestante
  }

  //Función para obtener los jugadores de la base de datos
  const cargarJugadores = async () => {
    const res = await axios.get(`http://localhost:3000/api/orden-turnos/${partidaId}`)
    jugadores.value = res.data
  }

  //Función para obtener las palabras de la base de datos para todos los equipos (pendientes)
  const cargarPalabras = async () => {
    const res = await axios.get(`http://localhost:3000/api/palabras/${partidaId}`)
    //Filtrar solo las palabras pendientes, sin importar el equipo
    words.value = res.data.filter(w => w.estado === 'pendiente')
    
    if (words.value.length > 0) {
      //Asignar una palabra aleatoria del bote de palabras
      word.value = words.value[Math.floor(Math.random() * words.value.length)].texto
    }
  }

  //Función para cambiar la palabra
  const changeWord = () => {
    if (words.value.length > 0) {
      word.value = words.value[Math.floor(Math.random() * words.value.length)].texto
    }
  }

  //El jugador acierta
  const correctWord = async () => {
    console.log(`${currentPlayer.value} acertó la palabra: ${word.value}`)
    const equipoId = currentPlayer.value.equipo_id
    await actualizarPalabraEstado(word.value, 'acertada') //Actualizar el estado de la palabra
    await sumarPuntosEquipo(equipoId) //Sumar 1 punto al equipo
    words.value = words.value.filter(w => w.texto !== word.value) //Eliminar la palabra de la lista
    changeWord() //Cambiar la palabra

    if (words.value.length === 0) {
      checkForPendingOrPassedWords()
    }
  }

  //El jugador pasa
  const passWord = async () => {
    console.log(`${currentPlayer.value} pasó la palabra: ${word.value}`)
    await actualizarPalabraEstado(word.value, 'pasada') //Actualizar el estado de la palabra
    words.value = words.value.filter(w => w.texto !== word.value) //Eliminar la palabra de la lista
    changeWord() //Cambiar la palabra
    const equipoId = currentPlayer.value.equipo_id
    await restarPuntosEquipo(equipoId) //Restar 1 punto al equipo por pasar la palabr

    if (words.value.length === 0) {
      checkForPendingOrPassedWords()
    }
  }

  //Función para actualizar el estado de la palabra en la base de datos
  const actualizarPalabraEstado = async (texto, estado) => {
    const palabra = words.value.find(w => w.texto === texto)
    if (palabra) {
      await axios.put(`http://localhost:3000/api/palabras/${palabra.id}`, { estado })
    }
  }

  //Función para sumar puntos al equipo del jugador
  const sumarPuntosEquipo = async (equipoId) => {
    await axios.put(`http://localhost:3000/api/equipos/${equipoId}`, { puntos: 1 })
  }

  //Función para restar puntos al equipo del jugador
  const restarPuntosEquipo = async (equipoId) => {
    await axios.put(`http://localhost:3000/api/equipos/${equipoId}`, { puntos: -1 })
  }

  //Función para comprobar si quedan palabras pendientes y redirigir si es necesario
  const checkForPendingOrPassedWords = async () => {
    const res = await axios.get(`http://localhost:3000/api/palabras/${partidaId}`)
    const palabrasPendientes = res.data.filter(p => p.estado === 'pendiente')
    const palabrasPasadas = res.data.filter(p => p.estado === 'pasada')

    const isUltimaRonda = tematicas.value[tematicas.value.length - 1] === estadoActual.value  

    //Si hay palabras pendientes, redirigir a la pantalla de cambio de turno
    if (palabrasPendientes.length > 0 || palabrasPasadas.length > 0) {
      router.push('/cambioturno')
    } else if (isUltimaRonda) {
      //Si estamos en la última ronda y no quedan palabras, mostrar resultados finales
      router.push('/resultados')
    } else {
      router.push('/cambioronda')
    }
  }

  //Cargar jugadores, palabras y cronómetro cuando se monte la vista
  onMounted(async () => {
    await cargarJugadores()
    await cargarPalabras()
    await cargarCronometro()
    startTimer()

    const resEstado = await axios.get(`http://localhost:3000/api/partidas/estado/${partidaId}`)
    estadoActual.value = resEstado.data.estado
    console.log('Estado en partida', estadoActual.value)

    const resTematicas = await axios.get(`http://localhost:3000/api/partidas/tematicas/${partidaId}`)
    tematicas.value = resTematicas.data.tematicas
    console.log('Tematica en partida', tematicas.value)
  })
</script>

<style scoped>
  .timer {
    font-size: 1.5rem;
    color: #333;
    font-weight: bold;
  }
  
  .buttons {
    display: flex;
    gap: 10px;
    margin-top: 20px;
  }
</style>

<template>
  <p>RONDA: {{ rondaNombre }}</p>
  <BasePage title="TURNO DE:">
    <div class="space-y-4">
      <h3 class="nombre-jugador"><strong>{{ playerName}}</strong></h3>

      <p class="margen-nombre-jugador">La palabra es...</p>
      <h3 class="ronda-titulo"><strong>{{ word }}</strong></h3>

      <!-- Cronómetro -->
      <div class="timer">
        <p><strong>{{ timer }}</strong> segundos</p>
        <div>
          <!-- Botón para editar el cronómetro -->
          <div class="edit-timer-button">
            <button @click="editTimer" class="btn-temporal btn-temporal-editar">Editar Tiempo</button>
          </div>
          <div v-if="isEditing">
            <input v-model="editedTime" type="number" class="input-tiempo" min="1" />
            <button @click="saveEdit" class="btn-temporal btn-temporal-guardar">Guardar</button>
          </div>
          <button @click="pauseTimer" class="btn-temporal btn-temporal-pausar" :disabled="isPaused">Pausar</button>
          <button @click="resumeTimer" class="btn-temporal btn-temporal-reanudar" :disabled="!isPaused">Reanudar</button>
          <button @click="resetTimer" class="btn-temporal btn-temporal-reiniciar">Reiniciar</button>
        </div>
      </div>

      <!-- Botones de puntuación -->
      <div class="buttons">
        <button @click="correctWord" class="btn-partida btn-acierto">Acierto (+1)</button>
        <button @click="passWord" class="btn-partida btn-pasar">Pasar (-1)</button>
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
  const jugadores = ref([]) //Lista de jugadores
  const words = ref([]) //Lista de palabras
  const word = ref('') //Palabra actual
  const timer = ref(10) //Cronómetro
  let interval = null //Variable para el setInterval
  const rondaNombre = ref('') //Ronda actual
  const tematicas = ref([]) //Temáticas de la partida
  const estadoActual = ref('') //Estado actual de la partida
  const isPaused = ref(false) //Estado de pausa del cronómetro
  const isEditing = ref(false) //Estado de edición
  const editedTime = ref(30) //Tiempo editado por el jugador
  
  //Obtener el jugador actual
  const currentPlayer = computed(() => {
    if (!jugadores.value || jugadores.value.length === 0) {
    return undefined;
    }
    const currentPlayerId = localStorage.getItem('lastPlayedPlayerId')
    if (!currentPlayerId) {
      return jugadores.value[0];
    }
    const foundPlayer = jugadores.value.find(jugador => jugador.jugador_id === Number(currentPlayerId));
    return foundPlayer || jugadores.value[0];
  })  
  
  //Obtener el nombre del jugador actual
  const playerName = computed(() => {
    const currentPlayerId = localStorage.getItem('lastPlayedPlayerId')
    const player = jugadores.value.find(jugador => jugador.jugador_id === Number(currentPlayerId))
    return player ? player.nombre : 'Cargando...'
  })  

  //Función para iniciar el cronómetro
  const startTimer = () => {
    console.log('Timer starts')
    if (interval) clearInterval(interval)
    interval = setInterval(() => {
      if (timer.value > 0 && !isPaused.value) {
        timer.value -= 1
      } else if (timer.value === 0) {
        console.log('Timer hit 0, calling checkForPendingOrPassedWords')
        clearInterval(interval)
        checkForPendingOrPassedWords()
        console.log('Timer ends') 
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
    try{
      const res = await axios.get(`http://localhost:3000/api/partidas/cronometro_restante/${partidaId}`)
      const cronometroRestante = res.data.cronometro_restante || 30
      timer.value = cronometroRestante
      editedTime.value = cronometroRestante
    } catch(error){
      console.error("Error en cargarCronometro:", error);
      timer.value = 30;
      editedTime.value = 30;
    }
  }

  //Función para obtener los jugadores de la base de datos
  const cargarJugadores = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/orden-turnos/${partidaId}`)
      console.log('cargarJugadores API response data:', JSON.stringify(res.data));
      jugadores.value = (res.data && Array.isArray(res.data)) ? res.data : []
      console.log('jugadores.value en cargarJugadores:', JSON.parse(JSON.stringify(jugadores.value)));
    } catch(error){
      console.error("Error en cargarJugadores:", error);
      jugadores.value = [];
      throw error;
    }
  }

  //Función para obtener las palabras de la base de datos para todos los equipos (pendientes)
  const cargarPalabras = async () => {
    try{
      const res = await axios.get(`http://localhost:3000/api/palabras/${partidaId}`)
      //Filtrar solo las palabras pendientes, sin importar el equipo
      const palabrasFromAPI = (res.data && Array.isArray(res.data)) ? res.data : [];
      words.value = palabrasFromAPI.filter(w => w.estado === 'pendiente')
      
      if (words.value.length > 0) {
        //Asignar una palabra aleatoria del bote de palabras
        word.value = words.value[Math.floor(Math.random() * words.value.length)].texto
      }
    }catch(error){
      console.error("Error en cargarPalabras:", error);
      words.value = [];
      word.value = '';
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
    try{
      console.log(`${currentPlayer.value} acertó la palabra: ${word.value}`)
      const equipoId = currentPlayer.value.equipo_id
      await actualizarPalabraEstado(word.value, 'acertada') //Actualizar el estado de la palabra
      await sumarPuntosEquipo(equipoId) //Sumar 1 punto al equipo
      words.value = words.value.filter(w => w.texto !== word.value) //Eliminar la palabra de la lista
      changeWord() //Cambiar la palabra

      if (words.value.length === 0) {
        checkForPendingOrPassedWords()
      }
    } catch (error){
      console.error("Error en correctWord:", error);
    }
  }

  //El jugador pasa
  const passWord = async () => {
    try{
      console.log(`${currentPlayer.value} pasó la palabra: ${word.value}`)
      await actualizarPalabraEstado(word.value, 'pasada') //Actualizar el estado de la palabra
      words.value = words.value.filter(w => w.texto !== word.value) //Eliminar la palabra de la lista
      changeWord() //Cambiar la palabra
      const equipoId = currentPlayer.value.equipo_id
      await restarPuntosEquipo(equipoId) //Restar 1 punto al equipo por pasar la palabr

      if (words.value.length === 0) {
        checkForPendingOrPassedWords()
      }
    } catch (error){
      console.error("Error en passWord:", error);
    }
  }

  //Función para actualizar el estado de la palabra en la base de datos
  const actualizarPalabraEstado = async (texto, estado) => {
    try {
      const palabra = words.value.find(w => w.texto === texto)
      if (palabra) {
        await axios.put(`http://localhost:3000/api/palabras/${palabra.id}`, { estado })
      }
    } catch(error){
      console.error("Error en actualizarPalabraEstado:", error);
    }
  }

  //Función para sumar puntos al equipo del jugador
  const sumarPuntosEquipo = async (equipoId) => {
    try{
      await axios.put(`http://localhost:3000/api/equipos/${equipoId}`, { puntos: 1 })
    } catch(error){
      console.error("Error en sumarPuntosEquipo:", error);
    }
  }

  //Función para restar puntos al equipo del jugador
  const restarPuntosEquipo = async (equipoId) => {
    try{
      await axios.put(`http://localhost:3000/api/equipos/${equipoId}`, { puntos: -1 })
    } catch(error){
      console.error("Error en restarPuntosEquipo:", error);
    }
  }

  //Función para comprobar si quedan palabras pendientes y redirigir si es necesario
  const checkForPendingOrPassedWords = async () => {
    try{
      const res = await axios.get(`http://localhost:3000/api/palabras/${partidaId}`)
      const palabrasFromAPI = (res.data && Array.isArray(res.data)) ? res.data : [];
      const palabrasPendientes = palabrasFromAPI.filter(p => p.estado === 'pendiente')
      const palabrasPasadas = palabrasFromAPI.filter(p => p.estado === 'pasada')

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
    }catch(error){
      console.error("Error en checkForPendingOrPassedWords:", error);
    }
  }

  //Cargar jugadores, palabras y cronómetro cuando se monte la vista
  onMounted(async () => {
    try{
      console.log('onMounted START');
      await cargarJugadores()
      console.log('onMounted cargarJugadores');
      await cargarPalabras()
      console.log('onMounted cargarPalabras');
      await cargarCronometro()
      console.log('onMounted] cargarCronometro');
      startTimer()
      console.log('onMounted startTimer');

      const resEstado = await axios.get(`http://localhost:3000/api/partidas/estado/${partidaId}`)
      console.log('onMounted estado:', resEstado.data);
      estadoActual.value = resEstado.data.estado
      rondaNombre.value = resEstado.data.estado
      console.log('Estado en partida', estadoActual.value)

      const resTematicas = await axios.get(`http://localhost:3000/api/partidas/tematicas/${partidaId}`)
      console.log('onMounted tematicas:', resTematicas.data);
      tematicas.value = resTematicas.data.tematicas
      console.log('Tematica en partida', tematicas.value)
      console.log('onMounted COMPLETADO');
    } catch(error){
      console.error("Error en PartidaView onMounted:", error);
      jugadores.value = [];
      words.value = [];
      timer.value = 60;
      rondaNombre.value = 'Error';
      if (interval) clearInterval(interval);
    }
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
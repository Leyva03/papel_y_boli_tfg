<template>
  <BasePage title="Cambio de Turno">
    <div class="space-y-6">
        <!-- Mostrar al jugador actual que acaba de jugar -->
      <p><strong>{{ currentPlayer.nombre }}</strong> tu tiempo ha terminado.</p>
        
      <!-- Mostrar los puntos de cada equipo -->
      <div class="points">
        <p><strong>Puntos acumulados:</strong></p>
        <div v-for="equipo in equipos" :key="equipo.id">
          <p><strong>{{ equipo.nombre }}:</strong> {{ equipo.puntos }}</p>
        </div>
      </div>
  
      <!-- Mostrar las palabras restantes -->
      <div class="remaining-words">
       <p><strong>Palabras restantes:</strong> {{ remainingWords.length }} / {{ totalWords }}</p>
        <ul>
          <li v-for="word in remainingWords" :key="word">{{ word }}</li>
        </ul>
      </div>
        
      <!-- Mostrar al jugador que le toca jugar -->
      <div class="next-player">
        <p>El siguiente jugador es...</p>
        <p><strong>{{ nextPlayer.nombre}}</strong></p> 
      </div>
  
      <!-- Botón para que el siguiente jugador pueda jugar -->
      <button @click="goToNextTurn" class="btn btn-primary">
        Continuar al siguiente jugador
      </button>
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
  const players = ref([]) //Lista de jugadores
  const equipos = ref([]) //Lista de equipos
  const currentPlayerIndex = ref(0) //Índice del jugador actual
  const remainingWords = ref([]) //Palabras no acertadas aún
  const totalWords = ref(0) //Total de palabras

  //Obtener el siguiente jugador
  const nextPlayer = computed(() => {
    if (players.value.length === 0) return { nombre: 'Cargando...' }
    const nextIndex = (currentPlayerIndex.value + 1) % players.value.length
    return players.value[nextIndex]
  })  

  //Obtener el jugador actual
  const currentPlayer = computed(() => {
    if (players.value.length === 0) return { nombre: 'Cargando...' }
    return players.value[currentPlayerIndex.value]
  })

  //Función para cargar los puntos de los equipos
  const cargarPuntosEquipos = async () => {
    const res = await axios.get(`http://localhost:3000/api/equipos/${partidaId}`)
    equipos.value = res.data
  }

  //Función para cargar las palabras restantes y acertadas desde la base de datos
  const cargarPalabras = async () => {
    await actualizarEstadoPalabras()
    const res = await axios.get(`http://localhost:3000/api/palabras/${partidaId}`)
    const palabras = res.data
    remainingWords.value = palabras.filter(p => p.estado === 'pendiente').map(p => p.texto) //Filtrar las palabras restantes (pendientes)
    totalWords.value = palabras.length //Obtener el total de palabras
  }

  //Función para actualizar las palabras pasadas a pendiente
  const actualizarEstadoPalabras = async () => {
    const palabrasPasadas = await axios.get(`http://localhost:3000/api/palabras/${partidaId}`)
    const palabras = palabrasPasadas.data
    const palabrasAPasar = palabras.filter(p => p.estado === 'pasada') //Filtrar las palabras pasadas y actualizar su estado
    for (const palabra of palabrasAPasar) {
      await axios.put(`http://localhost:3000/api/palabras/${palabra.id}`, { estado: 'pendiente' })
    }
  }

  //Función para cargar el orden de los turnos desde la base de datos
  const cargarOrdenTurnos = async () => {
    const res = await axios.get(`http://localhost:3000/api/orden-turnos/${partidaId}`)
    console.log('Datos de orden de turnos:', res.data)
    players.value = res.data

    const lastPlayedPlayerId = localStorage.getItem('lastPlayedPlayerId') //Obtener el jugador que acaba de jugar
    const currentTurnIndex = players.value.findIndex(player => player.jugador_id === Number(lastPlayedPlayerId))
    currentPlayerIndex.value = currentTurnIndex
  }


  //Función para cambiar al siguiente jugador
  const goToNextTurn = () => {
    const nextPlayerId = players.value[(currentPlayerIndex.value + 1) % players.value.length].jugador_id

    // Actualizar el índice del jugador al siguiente en el orden
    currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length
    console.log('Guardando ID del siguiente jugador en localStorage:', nextPlayerId)
    localStorage.setItem('lastPlayedPlayerId', nextPlayerId) //Guardar el ID del siguiente jugador

    //Redirigir a partida para que el siguiente jugador pueda jugar
    router.push('/partida')
  }

  onMounted(async () => {
    await cargarOrdenTurnos() //Cargar el orden de turnos
    await cargarPuntosEquipos() //Cargar los puntos de los equipos
    await cargarPalabras() //Cargar palabras
  })
</script>

<style scoped>
  .points, .remaining-words, .next-player {
    font-size: 1.2rem;
  }

  button {
    margin-top: 20px;
  }
</style>

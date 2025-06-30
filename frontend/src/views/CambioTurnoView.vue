<template>
  <BasePage title="Cambio de Turno">
    <div class="page-with-fixed-button">
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
      </div>
        
      <!-- Mostrar al jugador que le toca jugar -->
      <div>
        <p class="texto-jugador">El siguiente jugador es...</p>
        <p class="nombre-jugador"><strong>{{ nextPlayer.nombre}}</strong></p> 
        <p>Al pulsar continuará la ronda, sólo <strong>{{ nextPlayer.nombre }}</strong></p><p>puede ver la pantalla</p>
      </div>
    </div>
  
      <!-- Botón para que el siguiente jugador pueda jugar -->
      <div class="boton-guardar-container-abajo-siempre">
        <img
          src="@/assets/guardartodo.png"
          alt="Continuar al siguiente jugador"
          @click="goToNextTurn"
          class="cursor-pointer transition-transform duration-300 hover:scale-110"
          style="max-width: 300px; width: 100%; height: auto;"
        />
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
    try{
      const res = await axios.get(`http://localhost:3000/api/equipos/${partidaId}`)
      equipos.value = res.data
    } catch(error){
      console.error("Error en cargarPuntosEquipos:", error);
      equipos.value = [];
    }
  }

  //Función para cargar las palabras restantes y acertadas desde la base de datos
  const cargarPalabras = async () => {
    try{
      await actualizarEstadoPalabras()
      const res = await axios.get(`http://localhost:3000/api/palabras/${partidaId}`)
      const palabras = res.data
      remainingWords.value = palabras.filter(p => p.estado === 'pendiente').map(p => p.texto) //Filtrar las palabras restantes (pendientes)
      totalWords.value = palabras.length //Obtener el total de palabras
    } catch(error){
      console.error("Error en cargarPalabras:", error);
      remainingWords.value = [];
      totalWords.value = 0;
    }

  }

  //Función para actualizar las palabras pasadas a pendiente
  const actualizarEstadoPalabras = async () => {
    try{
      const palabrasPasadas = await axios.get(`http://localhost:3000/api/palabras/${partidaId}`)
      const palabras = palabrasPasadas.data
      const palabrasAPasar = palabras.filter(p => p.estado === 'pasada') //Filtrar las palabras pasadas y actualizar su estado
      for (const palabra of palabrasAPasar) {
        await axios.put(`http://localhost:3000/api/palabras/${palabra.id}`, { estado: 'pendiente' })
      }
    } catch(error){
      console.error("Error en actualizarEstadoPalabras:", error);
    }

  }

  //Función para cargar el orden de los turnos desde la base de datos
  const cargarOrdenTurnos = async () => {
    try{
      const res = await axios.get(`http://localhost:3000/api/orden-turnos/${partidaId}`)
      console.log('Datos de orden de turnos:', res.data)
      players.value = (res && res.data && Array.isArray(res.data)) ? res.data : [];
      console.log('players.value en cargarOrdenTurnos:', JSON.stringify(players.value));
      
      const lastPlayedPlayerId = localStorage.getItem('lastPlayedPlayerId');
      if (players.value.length > 0 && lastPlayedPlayerId) {
        const currentTurnIndex = players.value.findIndex(player => player.jugador_id === Number(lastPlayedPlayerId));
        currentPlayerIndex.value = currentTurnIndex !== -1 ? currentTurnIndex : 0;
      } else {
        currentPlayerIndex.value = 0;
      }
    }catch(error){
      console.error("Error en cargarOrdenTurnos:", error);
      players.value = [];
      currentPlayerIndex.value = 0; 
    }
  }


  //Función para cambiar al siguiente jugador
  const goToNextTurn = () => {
    const nextPlayerId = players.value[(currentPlayerIndex.value + 1) % players.value.length].jugador_id

    currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length
    console.log('Guardando ID del siguiente jugador en localStorage:', nextPlayerId)
    localStorage.setItem('lastPlayedPlayerId', nextPlayerId.toString()) //Guardar el ID del siguiente jugador

    //Redirigir a partida para que el siguiente jugador pueda jugar
    router.push('/partida')
  }

  onMounted(async () => {
    try {
      await cargarOrdenTurnos() //Cargar el orden de turnos
      await cargarPuntosEquipos() //Cargar los puntos de los equipos
      await cargarPalabras() //Cargar palabras
    } catch(error){
      console.error("Error general durante onMounted en CambioTurnoView:", error);
      equipos.value = [];
      remainingWords.value = [];
      totalWords.value = 0;
    }

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

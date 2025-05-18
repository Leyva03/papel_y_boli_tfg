<template>
  <BasePage title="Cambio de Ronda">
    <div class="space-y-6">

      <!-- Mostrar los resultados de la ronda -->
      <h3><strong>Resultados de la ronda</strong></h3>
      <div class="points">
        <p><strong>Puntos acumulados:</strong></p>
        <div v-for="equipo in equipos" :key="equipo.id">
          <p><strong>{{ equipo.nombre }}:</strong> {{ equipo.puntos }}</p>
        </div>
      </div>

      <!-- Mostrar la siguiente temática -->
      <div class="next-tematica">
        <p><strong>Siguiente Temática:</strong> {{ siguienteTematica }}</p>
      </div>

      <!-- Mostrar el siguiente jugador -->
      <div class="next-player">
        <p>El siguiente jugador es...</p>
        <p><strong>{{ nextPlayer.nombre }}</strong></p> 
      </div>

      <!-- Botón para cambiar a la siguiente temática y que el siguiente jugador pueda jugar -->
      <button @click="goToNextTurn" class="btn btn-primary">
        Continuar a la siguiente ronda
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
  const tematicas = ref([]) //Temáticas de la partida
  const siguienteTematica = ref('');


  //Obtener el siguiente jugador
  const nextPlayer = computed(() => {
    if (players.value.length === 0) return { nombre: 'Cargando...' }
    const nextIndex = (currentPlayerIndex.value + 1) % players.value.length
    return players.value[nextIndex]
  })  

  //Función para cargar las temáticas de la partida y el estado
  const cargarTematicas = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/partidas/tematicas/${partidaId}`);
      if (res.data && res.data.tematicas) {
        tematicas.value = res.data.tematicas;
        const estado = await axios.get(`http://localhost:3000/api/partidas/estado/${partidaId}`);
        if (estado.data) {
          const currentIndex = tematicas.value.indexOf(estado.data.estado);
          siguienteTematica.value = currentIndex < tematicas.value.length - 1
            ? tematicas.value[currentIndex + 1]
            : tematicas.value[0];
        }
      }
    } catch (error) {
      console.error("Error al cargar las temáticas:", error);
    }
  };

  //Función para cargar los puntos de los equipos
  const cargarPuntosEquipos = async () => {
    const res = await axios.get(`http://localhost:3000/api/equipos/${partidaId}`)
    equipos.value = res.data
  }

  //Función para cargar las palabras restantes y acertadas desde la base de datos
  const cargarPalabras = async () => {
    const res = await axios.get(`http://localhost:3000/api/palabras/${partidaId}`)
    const palabras = res.data
    remainingWords.value = palabras.filter(p => p.estado === 'pendiente').map(p => p.texto) //Filtrar las palabras restantes (pendientes)
    totalWords.value = palabras.length //Obtener el total de palabras
  }

  //Función para cargar el orden de los turnos desde la base de datos
  const cargarOrdenTurnos = async () => {
    const res = await axios.get(`http://localhost:3000/api/orden-turnos/${partidaId}`)
    players.value = res.data

    const lastPlayedPlayerId = localStorage.getItem('lastPlayedPlayerId') //Obtener el jugador que acaba de jugar
    const currentTurnIndex = players.value.findIndex(player => player.jugador_id === Number(lastPlayedPlayerId))
    currentPlayerIndex.value = currentTurnIndex
  }

  //Función para resetear las palabras a pendiente
  const resetearPalabras = async () => {
    const palabras = await axios.get(`http://localhost:3000/api/palabras/${partidaId}`)
    for (const palabra of palabras.data) {
      if (palabra.estado === 'acertada') {
        await axios.put(`http://localhost:3000/api/palabras/${palabra.id}`, { estado: 'pendiente' })
      }
    }
  }

  //Función para continuar con el siguiente turno
  const goToNextTurn = async () => {
    const nextPlayerId = players.value[(currentPlayerIndex.value + 1) % players.value.length].jugador_id
    currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length
    localStorage.setItem('lastPlayedPlayerId', nextPlayerId) //Guardar el ID del siguiente jugador
    await axios.put(`http://localhost:3000/api/partidas/siguiente-tematica/${partidaId}`, {
      estado: siguienteTematica.value, // Guardar la siguiente temática
      tematicas: tematicas.value // Guardar las temáticas para buscar la siguiente
    })
    console.log("Enviando estado:", siguienteTematica.value);
    console.log("Enviando temáticas:", tematicas.value);
    await resetearPalabras() //Resetear palabras a "pendiente"

    //Redirigir a partida para que el siguiente jugador pueda jugar
    router.push('/partida')
  }

  onMounted(async () => {
    await cargarOrdenTurnos() //Cargar orden de turnos
    await cargarPuntosEquipos() //Cargar puntos
    await cargarPalabras() //Cargar palabras
    await cargarTematicas() //Cargar temáticas y el estado
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

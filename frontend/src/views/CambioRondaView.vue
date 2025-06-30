<template>
  <BasePage title="Cambio de Ronda">
    <div class="page-with-fixed-button">

      <!-- Mostrar los resultados de la ronda -->
      <h3><strong>Resultados de la ronda</strong></h3>
      <div class="points">
        <p><strong>Puntos acumulados:</strong></p>
        <div v-for="equipo in equipos" :key="equipo.id">
          <p><strong>{{ equipo.nombre }}:</strong> {{ equipo.puntos }}</p>
        </div>
      </div>

      <!-- Mostrar la siguiente temática -->
      <div class="next-player">
        <p class="siguiente-tematica-label"><strong>Siguiente Temática:</strong></p>
        <p class="ronda-titulo">{{ siguienteTematica }}</p>
      </div>

      <!-- Mostrar el siguiente jugador -->
      <div>
        <p class="texto-jugador">El siguiente jugador es...</p>
        <p class="nombre-jugador"><strong>{{ nextPlayer.nombre }}</strong></p> 
        <p>Al pulsar empezará la ronda, sólo <strong>{{ nextPlayer.nombre }}</strong></p><p>puede ver la pantalla</p>
      </div>
    </div>

      <!-- Botón para cambiar a la siguiente temática y que el siguiente jugador pueda jugar -->
      <div class="boton-guardar-container-abajo-siempre">
        <img
          src="@/assets/guardartodo.png"
          alt="Continuar a la siguiente ronda"
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
  const tematicas = ref([]) //Temáticas de la partida
  const siguienteTematica = ref('');


  //Obtener el siguiente jugador
  const nextPlayer = computed(() => {
    if (!players.value || players.value.length === 0 || currentPlayerIndex.value < 0) return { nombre: 'Cargando...' }
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
    try{
      const res = await axios.get(`http://localhost:3000/api/equipos/${partidaId}`)
      equipos.value = res.data
    } catch (error){
      console.error("Error en cargarPuntosEquipos:", error);
      equipos.value = [];
    }

  }

  //Función para cargar las palabras restantes y acertadas desde la base de datos
  const cargarPalabras = async () => {
    try{
      const res = await axios.get(`http://localhost:3000/api/palabras/${partidaId}`)
      const palabras = res.data
      remainingWords.value = palabras.filter(p => p.estado === 'pendiente').map(p => p.texto) //Filtrar las palabras restantes (pendientes)
      totalWords.value = palabras.length //Obtener el total de palabras
    } catch (error){
      console.error("Error en cargarPalabras:", error);
      remainingWords.value = [];
      totalWords.value = 0;
    }
  }

  //Función para cargar el orden de los turnos desde la base de datos
  const cargarOrdenTurnos = async () => {
    try{
      const res = await axios.get(`http://localhost:3000/api/orden-turnos/${partidaId}`)
      players.value = res.data

      const lastPlayedPlayerId = localStorage.getItem('lastPlayedPlayerId') //Obtener el jugador que acaba de jugar
      const currentTurnIndex = players.value.findIndex(player => player.jugador_id === Number(lastPlayedPlayerId))
      currentPlayerIndex.value = currentTurnIndex !== -1 ? currentTurnIndex : 0;
    } catch (error){
      console.error("Error en cargarOrdenTurnos:", error);
      players.value = [];
      currentPlayerIndex.value = 0;
    }

  }

  //Función para resetear las palabras a pendiente
  const resetearPalabras = async () => {
    try{
      console.log('Inicio resetearPalabras...');
      const palabras = await axios.get(`http://localhost:3000/api/palabras/${partidaId}`)
      const palabrasData = (palabras && palabras.data && Array.isArray(palabras.data)) ? palabras.data : [];
      console.log('Palabras para reset:', JSON.stringify(palabrasData));
      let putCalledInLoop = false;
      for (const palabra of palabrasData) {
        console.log('Checking palabra:', JSON.stringify(palabra));
        if (palabra.estado === 'acertada') {
          console.log('Palabra acertada', palabra.id);
          await axios.put(`http://localhost:3000/api/palabras/${palabra.id}`, { estado: 'pendiente' })
          putCalledInLoop = true;
        }
      }
      console.log('Loop', putCalledInLoop);
    } catch (error){
      console.error("Error en resetearPalabras:", error);
    }
  }

  //Función para continuar con el siguiente turno
  const goToNextTurn = async () => {
    try{
      const nextIndex = (currentPlayerIndex.value + 1) % players.value.length;
      const nextPlayerId = players.value[nextIndex].jugador_id;
      localStorage.setItem('lastPlayedPlayerId', nextPlayerId.toString()) //Guardar el ID del siguiente jugador
      await axios.put(`http://localhost:3000/api/partidas/siguiente-tematica/${partidaId}`, {
        estado: siguienteTematica.value, //Guardar la siguiente temática
        tematicas: tematicas.value //Guardar las temáticas para buscar la siguiente
      })
      console.log("Enviando estado:", siguienteTematica.value);
      console.log("Enviando temáticas:", tematicas.value);
      await resetearPalabras() //Resetear palabras a "pendiente"

      //Redirigir a partida para que el siguiente jugador pueda jugar
      router.push('/partida')
    } catch(error){
      console.error("Error en goToNextTurn:", error);
    }
  }

  onMounted(async () => {
    try{
      await cargarOrdenTurnos() //Cargar orden de turnos
      await cargarPuntosEquipos() //Cargar puntos
      await cargarPalabras() //Cargar palabras
      await cargarTematicas() //Cargar temáticas y el estado
    } catch (error){
      console.error("Error general durante onMounted en CambioRondaView:", error);
      players.value = [];
      equipos.value = [];
      remainingWords.value = [];
      totalWords.value = 0;
      siguienteTematica.value = '';
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

<template>
  <BasePage title="¡FIN DEL JUEGO!">
    <div class="page-with-fixed-button">

      <!-- Mostrar el ganador de la partida -->
      <div v-if="winner" class="winner">
        <h3 class="texto-jugador">El equipo ganador es:</h3>
        <strong class="ronda-titulo">{{ winner }}</strong>
        <h2> con {{ winnerPoints }} puntos</h2>
      </div>
      
      <!-- Mostrar los resultados de la partida -->
      <div class="team-scores">
        <h3 class="text-xl">Recuento final:</h3>
        <ul>
          <li v-for="(score, team) in scores" :key="team" :class="{ 'equipo-ganador-lista': team === winner }">
            {{ team }}: {{ score }} puntos
          </li>
        </ul>
      </div>
    </div>
      <!-- Botón para reinicar el juego -->
      <div class="boton-guardar-container-abajo-siempre">
        <img
          src="@/assets/guardartodo.png"
          alt="Volver a jugar"
          @click="restartGame"
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
  const scores = ref({}) //Puntuaciones de los equipos
  const winner = ref('') //Nombre del equipo ganador
  const winnerPoints = ref(0) //Puntos del equipo ganador

  //Cargar las puntuaciones de los equipos
  const cargarPuntosEquipos = async () => {
    try {
      const res = await axios.get(`http://localhost:3000/api/equipos/${partidaId}`)
      scores.value = res.data.reduce((acc, equipo) => {
        acc[equipo.nombre] = equipo.puntos || 0
        return acc
      }, {})

      //Calcular el equipo ganador
      const teamScores = Object.entries(scores.value)
      let maxScore = Math.max(...teamScores.map(([team, score]) => score))
      winner.value = teamScores.find(([team, score]) => score === maxScore)[0]
      winnerPoints.value = maxScore
    } catch (error) {
      console.error('Error al cargar los puntos de los equipos:', error)
    }
  }

  //Función para reiniciar el juego (redirigir al inicio)
  const restartGame = () => {
    router.push('/')
  }

  onMounted(async () => {
    await cargarPuntosEquipos()
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

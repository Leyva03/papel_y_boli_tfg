<template>
    <BasePage title="¡FIN DEL JUEGO!">
      <div class="space-y-6">        
        <div v-if="winner" class="winner">
          <h3 class="text-xl">¡El equipo ganador es:</h3>
          <h2 class="font-bold"><strong>{{ winner }}</strong> con {{ winnerPoints }} puntos</h2>
        </div>
        
        <div class="team-scores">
          <h3 class="text-xl">Recuento final:</h3>
          <ul>
            <li v-for="(score, team) in scores" :key="team">
              {{ team }}: {{ score }} puntos
            </li>
          </ul>
        </div>
        
        <div class="button-container">
          <button @click="restartGame" class="btn btn-primary">Volver a jugar</button>
        </div>
      </div>
    </BasePage>
  </template>
  
  <script setup>
    import { ref, computed } from 'vue'
    import { useRouter } from 'vue-router'
    import BasePage from '../components/base/BasePage.vue'
  
    //Datos de puntuaciones de equipos
    const scores = ref({
      'Equipo 1': 20, //Ejemplo de puntuación
      'Equipo 2': 15
    })
  
    //Calcular el equipo ganador
    const winner = computed(() => {
      const teamScores = Object.entries(scores.value)
      let maxScore = Math.max(...teamScores.map(([team, score]) => score))
      return teamScores.find(([team, score]) => score === maxScore)[0]
    })
  
    const winnerPoints = computed(() => {
      const teamScores = Object.entries(scores.value)
      let maxScore = Math.max(...teamScores.map(([team, score]) => score))
      return maxScore
    })
  
    //Función para reiniciar el juego
    const restartGame = () => {
      const router = useRouter()
      router.push('/inicio')
    }
  </script>
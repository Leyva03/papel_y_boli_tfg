<template>
    <BasePage title="Cambio de Turno">
      <div class="space-y-6">
        <p><strong>{{ currentPlayer }}</strong> tu tiempo ha terminado.</p>
        
        <div class="points">
          <p><strong>Puntos acumulados:</strong> {{ points[currentPlayerIndex.value] }}</p>
        </div>
  
        <div class="remaining-words">
          <p><strong>Palabras restantes:</strong></p>
          <ul>
            <li v-for="word in remainingWords" :key="word">{{ word }}</li>
          </ul>
        </div>
  
        <div class="next-player">
          <p>El siguiente jugador es...</p>
          <p><strong>{{ nextPlayer }}</strong></p> 
        </div>
  
        <button @click="goToNextTurn" class="btn btn-primary">
          Continuar al siguiente jugador
        </button>
      </div>
    </BasePage>
</template>
  
<script setup>
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import BasePage from '../components/base/BasePage.vue'
  
  const router = useRouter()
  
  //Variables de estado
  const players = ref(['Jugador 1', 'Jugador 2'])
  const currentPlayerIndex = ref(0)
  const points = ref([0, 0]) //Puntos de los jugadores
  const words = ref(['Manzana', 'Playa', 'Perro', 'Pelota', 'Coche', 'Gato'])
  let remainingWords = ref(words.value) //Palabras no acertadas aún
  
  //Computed para obtener el siguiente jugador
  const nextPlayer = computed(() => {
    const nextIndex = (currentPlayerIndex.value + 1) % players.value.length
    return players.value[nextIndex]
  })
  
  //Función para cambiar al siguiente jugador
  const goToNextTurn = () => {
    currentPlayerIndex.value = (currentPlayerIndex.value + 1) % players.value.length
    
    //Si ya no hay palabras, ir a la pantalla de la siguiente ronda o a la final
    if (remainingWords.value.length === 0) {
      //Aquí puedes añadir lógica para cambiar entre las pantallas 4 o 7 dependiendo de la ronda
      router.push('/prejuego') //Redirigir a la pantalla de Pre Juego
    } else {
      //Si aún hay palabras, ir a la pantalla de partida para continuar con el siguiente jugador
      router.push('/partida')
    }
  }
  
  //Lógica para simular los puntos acumulados
  const addPoints = (playerIndex, pointsEarned) => {
    points.value[playerIndex] += pointsEarned
  }
</script>
  
<style scoped>
  .points, .remaining-words, .next-player {
    font-size: 1.2rem;
  }
  
  button {
    margin-top: 20px;
  }
</style>
  
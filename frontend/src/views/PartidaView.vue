<template>
    <p>Ronda: {{ round }}</p>
    <BasePage title="TURNO DE:">
      <div class="space-y-4">
        <h3><strong>{{ currentPlayer }}</strong></h3>
        <p>la palabra es...</p>
        <h3><strong>{{ word }}</strong></h3>
        <div class="timer">
          <p><strong>{{ timer }}</strong> segundos</p>
        </div>
        <div class="buttons">
          <button @click="correctWord" class="btn btn-success">Acierto</button>
          <button @click="passWord" class="btn btn-danger">Pasar</button>
        </div>
      </div>
    </BasePage>
</template>
  
<script setup>
    import { ref, computed, onMounted } from 'vue'
    import { useRouter } from 'vue-router'
    import BasePage from '../components/base/BasePage.vue'
    
    //Inicialización de variables
    const router = useRouter()
    const players = ref(['Jugador 1', 'Jugador 2']) //Jugadores activos
    const currentPlayerIndex = ref(0) //Índice del jugador activo
    const words = ref(['Manzana', 'Playa', 'Perro', 'Pelota', 'Coche', 'Gato']) //Lista de palabras
    const word = ref(words.value[Math.floor(Math.random() * words.value.length)]) //Palabra actual
    const timer = ref(30) //Cronómetro de 30 segundos
    let interval = null //Variable para manejar el setInterval
    
    //Ronda actual (para gestionar la lógica de las rondas)
    const round = ref(1)
    
    //Computed para obtener el jugador actual
    const currentPlayer = computed(() => players.value[currentPlayerIndex.value])
    
    //Función para iniciar el cronómetro
    const startTimer = () => {
      interval = setInterval(() => {
        if (timer.value > 0) {
          timer.value -= 1
        } else {
          clearInterval(interval) //Detener cronómetro
          if (words.value.length > 0) {
            //Si aún quedan palabras, redirigir a la pantalla de cambio de turno (pantalla 6)
            router.push('/cambioturno')
          } else {
            //Si ya no hay palabras, redirigir a la pantalla de Pre Juego (pantalla 4)
            router.push('/prejuego')
          }
        }
      }, 1000)
    }
  
    //Función para cambiar la palabra
    const changeWord = () => {
      if (words.value.length > 0) {
        word.value = words.value[Math.floor(Math.random() * words.value.length)]
      }
    }
  
    //Lógica cuando el jugador acierta
    const correctWord = () => {
      console.log(`${currentPlayer.value} acertó la palabra: ${word.value}`)
      words.value = words.value.filter(w => w !== word.value) //Eliminar la palabra de la lista
      changeWord() //Cambiar la palabra
  
      //Si ya no hay palabras, redirigir a la pantalla de Pre Juego (pantalla 4)
      if (words.value.length === 0) {
        router.push('/prejuego')
      }
    }
    
    //Lógica cuando el jugador pasa
    const passWord = () => {
      console.log(`${currentPlayer.value} pasó la palabra: ${word.value}`)
      words.value = words.value.filter(w => w !== word.value) //Eliminar la palabra de la lista
      changeWord() //Cambiar la palabra
  
      //Si ya no hay palabras, redirigir a la pantalla de Pre Juego (pantalla 4)
      if (words.value.length === 0) {
        router.push('/prejuego')
      }
    }
    
    //Iniciar el cronómetro cuando se cargue la vista
    onMounted(() => {
      startTimer()
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
  
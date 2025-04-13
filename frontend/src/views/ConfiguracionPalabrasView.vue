<template>
    <BasePage title="TURNO DE:">
      <div v-if="currentPlayer" class="space-y-4">
        <h3><strong>{{ currentPlayer }}</strong></h3>
        <P>¡Que nadie más vea la pantalla!</P>
        <div v-for="i in 3" :key="i" class="flex flex-col">
          <label :for="'word' + i">Palabra {{ i }}:</label>
          <input v-model="words[i]" :id="'word' + i" type="text" class="input"/>
        </div>
        <P>Cuando hayas terminado pulsa el botón y pásale el dispositivo al jugador que marque la pantalla</P>
        <button @click="nextPlayer" class="btn btn-primary">Siguiente Jugador</button>
      </div>
    </BasePage>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import BasePage from '../components/base/BasePage.vue'

  const router = useRouter()  //Inicialización del router
  
  const players = ref(['Jugador 1', 'Jugador 2']) //Lista de jugadores
  const currentPlayerIndex = ref(0)
  const words = ref([null, null, null])
  
  const currentPlayer = computed(() => players.value[currentPlayerIndex.value])
  
  const nextPlayer = () => {
    //Cuando termine un jugador, pasar al siguiente
    if (currentPlayerIndex.value < players.value.length - 1) {
      currentPlayerIndex.value++
      words.value = [null, null, null] //Resetr de palabras
    } else {
      //Cuando todos los jugadores hayan introducido palabras, redirigir a la siguiente pantalla
      router.push('/prejuego')
    }
  }
  </script>
  
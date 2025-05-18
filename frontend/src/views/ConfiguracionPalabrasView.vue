<template>
  <BasePage title="TURNO DE:">
    <div v-if="currentPlayer" class="space-y-4">
      <h3><strong>{{ currentPlayer.nombre }}</strong></h3>
      <P>¡Que nadie más vea la pantalla!</P>

      <!-- Generar campos de palabras según el número de palabras por persona -->
      <div v-for="i in numeroPalabras" :key="i" class="flex flex-col">
        <label :for="'word' + i">Palabra {{ i }}:</label>
        <input v-model="words[i - 1]" :id="'word' + i" type="text" class="input" />
      </div>

      <P>Cuando hayas terminado pulsa el botón y pásale el dispositivo al jugador que marque la pantalla</P>
      <button @click="nextPlayer" class="btn btn-primary">Siguiente Jugador</button>
    </div>
  </BasePage>
</template>
  
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import BasePage from '../components/base/BasePage.vue'

const router = useRouter()
const partidaId = localStorage.getItem('partidaId')

const jugadores = ref([])
const currentIndex = ref(0)
const words = ref([]) //Lista de palabras a introducir
const numeroPalabras = ref(3) //Número de palabras por persona por defecto


const currentPlayer = computed(() => jugadores.value[currentIndex.value])

//Cargar orden de turnos y número de palabras palabras
onMounted(async () => {
  const resNumeroPalabras = await axios.get(`http://localhost:3000/api/partidas/numero-palabras/${partidaId}`)
  numeroPalabras.value = resNumeroPalabras.data.numero_palabras || 3 // Usar 3 como valor por defecto si no se encuentra el valor

  const resJugadores = await axios.get(`http://localhost:3000/api/orden-turnos/${partidaId}`)
  jugadores.value = resJugadores.data

  if (jugadores.value.length > 0) {
    const firstPlayerId = jugadores.value[0].jugador_id
    localStorage.setItem('lastPlayedPlayerId', firstPlayerId)
  }  
})

//Botón para pasar al siguiente jugador
const nextPlayer = async () => {
  const jugador = jugadores.value[currentIndex.value]

  //Guardar las palabras introducidas en la base de datos
  for (const word of words.value) {
    if (word.trim() !== '') {
      await axios.post('http://localhost:3000/api/palabras', {
        texto: word,
        estado: 'pendiente',
        partida_id: partidaId,
        equipo_id: jugador.equipo_id
      })
    }
  }

  //Limpiar palabras para el siguiente jugador
  words.value = Array(numeroPalabras.value).fill('')

  if (currentIndex.value < jugadores.value.length - 1) {
    currentIndex.value++
  } else {
    //Redirigir a la pantalla previa a la partida
    router.push('/prejuego')
  }
}
</script>
<template>
  <BasePage title="¡YA ESTÁ TODO CONFIGURADO!">
    <h2>RONDA 1: {{ rondaNombre }}</h2>

    <!-- Mostrar al jugador que le toca jugar -->
    <p>El primer jugador es...</p>
    <h3><strong>{{ jugador?.nombre }}</strong></h3>
    <p>Al pulsar empezará la ronda, sólo <strong>{{ jugador?.nombre }}</strong> puede ver la pantalla</p>

    <!-- Botón para empezar la partida -->
    <button @click="startGame" class="btn btn-primary">Iniciar Juego</button>
  </BasePage>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'
import BasePage from '../components/base/BasePage.vue'

const router = useRouter()
const partidaId = localStorage.getItem('partidaId') //ID de la partida
const jugador = ref(null)
const rondaNombre = ref('')  //Nombre de la ronda (temática)

onMounted(async () => {
  try {
    const resTurnos = await axios.get(`http://localhost:3000/api/orden-turnos/${partidaId}`);
    if (resTurnos.data.length > 0) {
      jugador.value = resTurnos.data[0];  //Primer jugador del orden
      localStorage.setItem('ordenTurnos', JSON.stringify(resTurnos.data)); //Guardar el orden completo
      localStorage.setItem('indiceTurno', '0');  //Guardar el índice del jugador actual
    }
    const resPartida = await axios.get(`http://localhost:3000/api/partidas/estado/${partidaId}`);
    if (resPartida.data) {
      rondaNombre.value = resPartida.data.estado;  //"estado" contiene la temática de la ronda actual
    }
  } catch (error) {
    console.error("Error al obtener los datos de la partida o los turnos", error);
  }
})

//Función para empezar a jugar
function startGame() {
  //Redirigir a la vista partida para empezar a jugar
  router.push('/partida')
}
</script>

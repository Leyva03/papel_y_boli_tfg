<template>
  <BasePage title="OPCIONES A ELEGIR:">
    <div class="space-y-4">
      <div>
        <label for="team1" class="block">Equipo 1:</label>
        <input v-model="team1" id="team1" type="text" placeholder="Nombre del equipo 1" class="input"/>
      </div>
      <div>
        <label for="team1Players" class="block">Integrantes:</label>
        <input v-model="team1Players" id="team1Players" type="text" placeholder="Nombres de jugadores separados por coma" class="input"/>
      </div>
      <div>
        <label for="team2" class="block">Equipo 2:</label>
        <input v-model="team2" id="team2" type="text" placeholder="Nombre del equipo 2" class="input"/>
      </div>
      <div>
        <label for="team2Players" class="block">Integrantes:</label>
        <input v-model="team2Players" id="team2Players" type="text" placeholder="Nombres de jugadores separados por coma" class="input"/>
      </div>
      <button @click="startGame" class="btn btn-primary">Empezar Juego</button>
    </div>
  </BasePage>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import BasePage from '../components/base/BasePage.vue'

const router = useRouter()

const team1 = ref('')
const team2 = ref('')
const team1Players = ref('')
const team2Players = ref('')

const startGame = () => {
  //Guardar la información de los equipos y jugadores
  console.log('Equipo 1:', team1.value, 'Jugadores:', team1Players.value)
  console.log('Equipo 2:', team2.value, 'Jugadores:', team2Players.value)
  //Redirigir a la siguiente pantalla de configuración de palabras
  router.push('/palabras')  // Corregido aquí
}
</script>

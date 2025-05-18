<script setup>
import BasePage from '../components/base/BasePage.vue'
import BaseButton from '../components/base/BaseButton.vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

async function empezar() {
  try {
    const nuevaPartida = {
      estado: 'configuracion',
      tipo_rondas: 'default',
      turno_actual: 0,
      cronometro_restante: 60,
      fecha_creacion: new Date().toISOString()
    }

    const response = await axios.post('http://localhost:3000/api/partidas', nuevaPartida)
    const partidaId = response.data.id

    //Guardar el ID de la partida en localStorage
    localStorage.setItem('partidaId', partidaId)

    //Redirigir a configuración
    router.push('/configuracion')
  } catch (error) {
    console.error('Error al crear la partida', error)
    alert('Error al iniciar la partida. Intenta de nuevo.')
  }
}
</script>

<template>
    <h1 class="text-5xl font-bold mb-6 text-center">PAPEL Y BOLI</h1>

    <div class="flex justify-center">
      <img
        src="@/assets/empezarpartida.png"
        alt="Empezar Partida"
        @click="empezar"
        class="cursor-pointer transition-transform hover:scale-105"
        style="max-width: 300px; width: 100%; height: auto;"
      />
    </div>
</template>


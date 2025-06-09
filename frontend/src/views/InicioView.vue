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
    localStorage.setItem('partidaId', partidaId.toString())

    //Redirigir a configuración
    router.push('/configuracion')
  } catch (error) {
    console.error('Error al crear la partida', error)
    alert('Error al iniciar la partida. Intenta de nuevo.')
  }
}
</script>

<template>
  <div class="min-h-screen bg-[#9B40FD] text-white font-kaisei flex flex-col justify-center items-center relative titulo-inicio">

    <div class="absolute top-[20%] transform -translate-y-1/2 text-center leading-tight">
      <div class="text-[48px] md:text-[64px] lg:text-[80px] text-stroke-white">PAPEL</div>
      <div class="text-[32px] md:text-[40px] lg:text-[48px] text-stroke-white mt-2">Y</div>
      <div class="text-[48px] md:text-[64px] lg:text-[80px] text-stroke-white mt-2">BOLI</div>
    </div>

    <div class="flex-1 flex justify-center items-center">
      <img
        src="@/assets/empezarpartida.png"
        alt="Empezar Partida"
        @click="empezar"
        class="cursor-pointer transition-transform duration-300 hover:scale-110 max-w-xs w-full"
        style="max-width: 300px; width: 100%; height: auto;"
      />
    </div>
  </div>
</template>


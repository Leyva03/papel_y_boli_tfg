<script setup>
import BasePage from '../components/base/BasePage.vue'
import BaseButton from '../components/base/BaseButton.vue'
import { useRouter } from 'vue-router'

const router = useRouter()
function empezar() {
  router.push('/configuracion')
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


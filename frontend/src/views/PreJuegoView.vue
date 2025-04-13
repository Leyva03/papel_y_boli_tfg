<template>
    <BasePage title="¡YA ESTÁ TODO CONFIGURADO!">
      <h2>RONDA 1: DESCRIPCIÓN COMPLETA</h2>
      <p>El primer jugador es...</p>
      <h3><strong>{{ currentPlayer }}</strong></h3>
      <p>Al pulsar empezará la ronda, sólo <strong>{{ currentPlayer }}</strong> puede ver la pantalla</p>
      <button @click="startGame" class="btn btn-primary">Iniciar Juego</button>
    </BasePage>
  </template>
  
  <script setup>

  import { ref, computed } from 'vue'
  import { useRouter } from 'vue-router'
  import BasePage from '../components/base/BasePage.vue'

  const router = useRouter()
  
  const players = ref(['Jugador 1', 'Jugador 2']) //Lista de jugadores
  const currentPlayerIndex = ref(0)
  
  const currentPlayer = computed(() => players.value[currentPlayerIndex.value])
  
  const startGame = () => {
    //Iniciar la partida
    router.push('/partida')
  }
  </script>
  
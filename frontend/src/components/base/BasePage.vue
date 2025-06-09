<template>
    <div class="p-6 max-w-2xl mx-auto">
        <h1 class="titulo-inicio text-4xl titulo-sombra-suave mb-4 text-center text-white">{{ title }}</h1>
      <slot></slot>
    </div>
  </template>
  
  <script setup>
  defineProps({
    title: String
  })
  </script>
  
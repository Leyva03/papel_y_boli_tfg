<template>
    <div class="p-6 max-w-2xl mx-auto">
      <h1 class="text-2xl font-bold mb-4">{{ title }}</h1>
      <slot></slot>
    </div>
  </template>
  
  <script setup>
  defineProps({
    title: String
  })
  </script>
  
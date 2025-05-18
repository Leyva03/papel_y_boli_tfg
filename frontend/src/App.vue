<script setup>
import { RouterLink, RouterView } from 'vue-router'
//import HelloWorld from './components/HelloWorld.vue'
import TestConexion from './components/TestConexion.vue'
</script>

<template>
  <RouterView />
</template>

<style scoped> 
  /* Fondo global */
body {
  margin: 0;
  padding: 0;
  background-color: #9B40FD;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: white;
}

/* Estilo base para botones */
button {
  padding: 0.75rem 1.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
}

/* Botones por tipo */
.btn-success {
  background-color: #4CAF50;
}

.btn-success:hover {
  background-color: #45a049;
}

.btn-danger {
  background-color: #F44336;
}

.btn-danger:hover {
  background-color: #e53935;
}

/* Otros elementos comunes */
h1, h2, h3, h4, h5, h6, p, label, input, textarea {
  color: white;
}

/* Opcional: estilo para campos de formulario */
input, select, textarea {
  background-color: rgba(255, 255, 255, 0.1);
  border: 1px solid white;
  border-radius: 8px;
  padding: 0.5rem;
  color: white;
}

input::placeholder, textarea::placeholder {
  color: #e0e0e0;
}
</style>
<template>
    <nav class="navbar">
      <router-link to="/">Inicio</router-link>
      <router-link to="/configuracion">Configuración</router-link>
      <router-link to="/partida">Partida</router-link>
      <router-link to="/resultados">Resultados</router-link>
    </nav>
  </template>
  
  <style scoped>
  .navbar {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background-color: #f4f4f4;
    border-bottom: 1px solid #ccc;
  }
  .router-link-active {
    font-weight: bold;
    color: #42b983;
  }
  </style>
  
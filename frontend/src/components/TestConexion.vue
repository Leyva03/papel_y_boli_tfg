<template>
    <div>
      <h2>Test de conexión</h2>
      <button @click="probarConexion">Probar conexión con el backend</button>
    </div>
  </template>
  
  <script setup>
  import axios from 'axios'
  
  const probarConexion = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/test')
      console.log('Respuesta del backend:', res.data.message)
      alert(res.data.message)
    } catch (err) {
      console.error('Error al conectar con el backend:', err)
      alert('Error al conectar con el backend')
    }
  }
  </script>
  
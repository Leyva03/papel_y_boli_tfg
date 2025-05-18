<template>
  <BasePage title="CONFIGURAR EQUIPOS Y RONDAS">
    <div class="space-y-4">
      <div v-for="(equipo, index) in equipos" :key="index">
        <label :for="`equipo-${index}`" class="block">Equipo {{ index + 1 }}:</label>
        <input v-model="equipo.nombre" :id="`equipo-${index}`" type="text" class="input" placeholder="Nombre del equipo" />

        <label class="block">Jugadores:</label>
        <input v-model="equipo.jugadoresTexto" type="text" class="input" placeholder="Nombres separados por coma" />
      </div>

      <button @click="agregarEquipo" class="btn btn-secondary">+ Añadir otro equipo</button>

      <div>
        <label class="block">Número de palabras por persona:</label>
        <input v-model="numeroPalabras" type="number" min="1" class="input" />
      </div>

      <p>Las temáticas son las siguientes:</p>
      <ul>
        <li>Ronda 1: DESCRIBE LIBREMENTE</li>
        <li>Ronda 2: DESCRIBE CON UNA PALABRA</li>
        <li>Ronda 3: MÍMICA</li>
      </ul>

      <button @click="guardarTodo" class="btn btn-primary">Guardar y continuar</button>
    </div>
  </BasePage>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

const router = useRouter()
const partidaId = localStorage.getItem('partidaId')

const equipos = ref([
  { nombre: '', jugadoresTexto: '' },
  { nombre: '', jugadoresTexto: '' }
])

const numeroPalabras = ref(3) //Número de palabras por persona
const tematicas = ref(["DESCRIBE LIBREMENTE", "DESCRIBE CON UNA PALABRA", "MÍMICA"]) //Temáticas por defecto

function agregarEquipo() {
  equipos.value.push({ nombre: '', jugadoresTexto: '' })
}

//Botón para guardar la configuración
async function guardarTodo() {
  const equiposCreados = []

  for (const eq of equipos.value) {
    //Crear equipo
    const equipoRes = await axios.post('http://localhost:3000/api/equipos', {
      nombre: eq.nombre,
      partida_id: partidaId
    })
    const equipoId = equipoRes.data.id
    equiposCreados.push({ id: equipoId, jugadores: [] })

    //Crear jugadores
    const nombres = eq.jugadoresTexto.split(',').map(n => n.trim()).filter(n => n)
    for (const nombre of nombres) {
      const jugadorRes = await axios.post('http://localhost:3000/api/jugadores', {
        nombre,
        equipo_id: equipoId
      })
      equiposCreados.at(-1).jugadores.push(jugadorRes.data)
    }
  }

  const primeraTematica = tematicas.value[0]

  console.log("numero_palabras:", numeroPalabras.value);
  console.log("tematicas:", tematicas.value);
  console.log("estado:", primeraTematica);

  //Guardar rondas y temáticas
  await axios.put(`http://localhost:3000/api/partidas/${partidaId}`, {
    numero_rondas: numeroPalabras.value,
    tematicas: tematicas.value,
    estado: primeraTematica
  })

  //Generar orden de turnos rotativo y guardarlo
  const orden = generarOrdenTurnos(equiposCreados)
  await axios.post(`http://localhost:3000/api/orden-turnos`, {
    partida_id: partidaId,
    orden
  })

  //Redirigir a configuración de palabras
  router.push('/palabras')
}

function generarOrdenTurnos(equiposCreados) {
  const maxJugadores = Math.max(...equiposCreados.map(e => e.jugadores.length))
  const orden = []

  for (let i = 0; i < maxJugadores; i++) {
    for (const equipo of equiposCreados) {
      const jugador = equipo.jugadores[i % equipo.jugadores.length]
      orden.push({ jugador_id: jugador.id, equipo_id: equipo.id })
    }
  }

  return orden
}
</script>

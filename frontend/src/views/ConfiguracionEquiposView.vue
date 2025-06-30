<template>
  <BasePage title="OPCIONES A ELEGIR">
    <div class="contenido-principal">
      <div class="space-y-6">
        <div v-for="(equipo, index) in equipos" :key="index" class="mb-6">
          <h3 class="text-white font-bold">Equipo {{ index + 1 }}:</h3>
          <input
            v-model="equipo.nombre"
            :placeholder="`Introduce un nombre`"
            class="input-equipo"
            maxlength="15"
          />

          <p class="text-white mb-4">Integrantes: (5 máx.)</p>
          
          <div v-for="(jugador, jIndex) in equipo.jugadores" :key="jIndex" class="flex items-center mb-2">
            <input
              v-model="equipo.jugadores[jIndex]"
              class="input-jugador"
              placeholder="Introduce un jugador"
              maxlength="15"
            />
            <button @click="eliminarJugador(index, jIndex)" class="eliminar-jugador">✖</button>
          </div>

          <button
            v-if="equipo.jugadores.length < 5"
            @click="añadirJugador(index)"
            class="boton-integrante w-full"
          >
            + Añadir otro integrante
          </button>
        </div>

        <button v-if="equipos.length < 6" @click="añadirEquipo" class="boton-equipo">+ Añadir equipo</button>

        <button 
          v-if="equipos.length >= 3" 
          @click="eliminarUltimoEquipo" 
          class="boton-eliminar-equipo"
        >
          - Eliminar último
        </button>

        <div>
          <label class="texto-general">Número de palabras por persona:</label>
          <input v-model="numeroPalabras" type="number" min="1" max="10" class="input-numero-palabras" />
        </div>

        <p class="texto-general">Las temáticas son las siguientes:</p>
        <div class="text-white mb-4">
          <p>Ronda 1: DESCRIBE LIBREMENTE</p>
          <p>Ronda 2: DESCRIBE CON UNA PALABRA</p>
          <p>Ronda 3: MÍMICA</p>
        </div>
    </div>
  </div>
  <div class="espaciador-boton"></div>
  <div class="boton-guardar-container">
        <img
          src="@/assets/guardartodo.png"
          alt="Empezar Partida"
          @click="guardarTodo"
          class="cursor-pointer transition-transform duration-300 hover:scale-110"
          style="max-width: 300px; width: 100%; height: auto;"
        />
  </div>
  </BasePage>
</template>

<script setup>
import { ref, watch } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import BasePage from '../components/base/BasePage.vue'

const router = useRouter()
const partidaId = localStorage.getItem('partidaId')

const equipos = ref([
  { nombre: '', jugadores: [''] },
  { nombre: '', jugadores: [''] }
])

const numeroPalabras = ref(3) //Número de palabras por persona
const tematicas = ref(["DESCRIBE LIBREMENTE", "DESCRIBE CON UNA PALABRA", "MÍMICA"]) //Temáticas por defecto

function añadirEquipo() {
  equipos.value.push({ nombre: '', jugadores: [''] })
}

//Eliminar el último equipo añadido (solo si hay 3 o más equipos)
function eliminarUltimoEquipo() {
  if (equipos.value.length > 2) {
    equipos.value.pop()
  }
}

function añadirJugador(index) {
  if (equipos.value[index].jugadores.length < 5) {
    equipos.value[index].jugadores.push('');
  }
}

function eliminarJugador(equipoIndex, jugadorIndex) {
  equipos.value[equipoIndex].jugadores.splice(jugadorIndex, 1);
}

//Botón para guardar la configuración
async function guardarTodo() {
  if (numeroPalabras.value < 1 || numeroPalabras.value > 10) {
    alert('El número de palabras debe ser entre 1 y 10.')
    return
  }
  //Validación
  for (const [i, eq] of equipos.value.entries()) {
    if (!eq.nombre.trim()) {
      alert(`El equipo ${i + 1} no tiene nombre.`);
      return;
    }

    if (!Array.isArray(eq.jugadores) || eq.jugadores.length === 0) {
      alert(`El equipo ${i + 1} no tiene jugadores.`);
      return;
    }

    const jugadoresValidos = eq.jugadores.map(j => j.trim()).filter(j => j !== '');

    if (jugadoresValidos.length !== eq.jugadores.length) {
      alert(`Hay jugadores sin nombre en el equipo ${i + 1}.`);
      return;
    }
  }
  try {
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
      const nombres = Array.isArray(eq.jugadores)
        ? eq.jugadores.map(n => n.trim()).filter(n => n)
        : []
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
  } catch(error){
    console.log('Error en guardarTodo:', error.message);
    console.error('Error al crear la partida', error);
    alert('Error al iniciar la partida. Intenta de nuevo.');
  }
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

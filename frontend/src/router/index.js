import { createRouter, createWebHistory } from 'vue-router'
import InicioView from '../views/InicioView.vue'
import ConfiguracionEquiposView from '../views/ConfiguracionEquiposView.vue'
import ConfiguracionPalabrasView from '../views/ConfiguracionPalabrasView.vue'
import PreJuegoView from '../views/PreJuegoView.vue'
import PartidaView from '../views/PartidaView.vue'
import CambioTurnoView from '../views/CambioTurnoView.vue'
import ResultadosView from '../views/ResultadosView.vue'
import CambioRondaView from '../views/CambioRondaView.vue'


const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', name: 'inicio', component: InicioView },
    { path: '/configuracion', name: 'configuracion', component: ConfiguracionEquiposView },
    { path: '/palabras', name: 'palabras', component: ConfiguracionPalabrasView },
    { path: '/prejuego', name: 'prejuego', component: PreJuegoView },
    { path: '/partida', name: 'partida', component: PartidaView },
    { path: '/cambioturno', name: 'cambioturno', component: CambioTurnoView },
    { path: '/resultados', name: 'resultados', component: ResultadosView },
    { path: '/cambioronda', name: 'cambioronda', component: CambioRondaView },
  ],
})

export default router

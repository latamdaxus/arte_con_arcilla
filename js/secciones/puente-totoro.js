/* ============================================================================
   SECCIÓN — Puente Totoro
   La figura despega de la última tarjeta de la colección, crece un 30% en el
   camino y aterriza en el slot de la sección de contacto, donde se queda.
   ============================================================================ */

import { SECUENCIAS, LADO_SPRITE } from '../config/escena.js';
import { SPRITE_EN_TARJETA, VUELO_TOTORO, PROGRESO_LLEGADA } from '../config/vuelos.js';
import { esMovil, rectAlScroll, rectPiezaEnTarjeta } from '../nucleo/geometria-tarjetas.js';
import { crearPuente, cuadroSegunProgreso } from './puente-base.js';
import { mostrarVacia } from './coleccion-tarjetas.js';

export function iniciarPuenteTotoro() {
  const calib = SPRITE_EN_TARJETA.totoro;
  const cfg = SECUENCIAS.totoro;
  const slot = document.getElementById('contactVisual');
  if (!slot) return;

  /* Los frames en los que las orejas quedan cortadas por el borde, pasados a
     progreso de vuelo. */
  const CORTE_DESDE = VUELO_TOTORO.cuadroCorteDesde / cfg.cuadros;
  const CORTE_HASTA = VUELO_TOTORO.cuadroCorteHasta / cfg.cuadros;

  /**
   * Cuánto hay que levantar el sprite en cada punto del vuelo (0 a 1) para meter
   * el borde superior del frame por detrás de la barra de navegación.
   */
  function rampaOrejas(p) {
    const inicio = CORTE_DESDE - VUELO_TOTORO.rampaEntrada;
    const fin = CORTE_HASTA + VUELO_TOTORO.rampaSalida;
    if (p <= inicio || p >= fin) return 0;
    let t = 1;
    if (p < CORTE_DESDE) t = (p - inicio) / VUELO_TOTORO.rampaEntrada;
    else if (p > CORTE_HASTA) t = (fin - p) / VUELO_TOTORO.rampaSalida;
    return gsap.parseEase('sine.inOut')(gsap.utils.clamp(0, 1, t));
  }

  const altoBarra = () => {
    const nav = document.getElementById('navbar');
    return nav ? nav.getBoundingClientRect().height : 0;
  };

  /**
   * Fija el tamaño del slot de contacto (el del despegue +30%) y devuelve su
   * rect. En desktop el contenido va centrado en un contenedor sticky de 100vh,
   * así que el centro vertical es media pantalla; en celular el bloque es de
   * flujo normal y hay que proyectarlo al scroll de llegada.
   */
  function medirSlot(ladoDespegue, scrollY) {
    const lado = Math.min(
      ladoDespegue * VUELO_TOTORO.crecimiento,
      window.innerWidth * VUELO_TOTORO.topeAncho,
      window.innerHeight * VUELO_TOTORO.topeAlto
    );
    slot.style.width = lado + 'px';
    slot.style.height = lado + 'px';

    if (esMovil()) {
      const r = rectAlScroll(slot, scrollY);
      return { lado, centroX: r.centroX, centroY: r.centroY };
    }
    const r = slot.getBoundingClientRect();
    return { lado, centroX: r.left + lado / 2, centroY: window.innerHeight / 2 };
  }

  /* La pieza estática de contacto se mantiene oculta hasta que el sprite termina
     de llegar: si no, ya hay un Totoro esperando en el slot y se pierde el efecto
     de que el de la animación llega y se queda. El último frame de la secuencia y
     la imagen estática son el mismo t_192 dibujado en el mismo cuadrado, así que
     el relevo es invisible. */
  let llego = false;
  function fijarLlegada(valor) {
    if (llego === valor) return;
    llego = valor;
    slot.classList.toggle('is-arrived', valor);
  }

  crearPuente({
    canvasId: 'totoroCanvas',
    secuencia: cfg,
    precarga: { trigger: '#vanGoghBridge', start: 'top top' },
    crearTrigger: ({ canvas, secuencia }) => {
      const movil = esMovil();

      return ScrollTrigger.create({
        /* Desktop: arranca cuando el recorrido horizontal ya terminó (última
           tarjeta centrada). Celular: no hay recorrido horizontal, así que
           despega en el mismo punto donde Van Gogh aterriza —la tarjeta
           centrada—, evitando que ambos sprites se pisen. Acaba cuando la
           sección de contacto queda en su sitio. */
        trigger: movil ? '.tarjeta .tarjeta__foto' : '#coleccion',
        start: movil ? 'center center' : 'bottom bottom',
        endTrigger: '#contacto',
        end: 'top top',
        scrub: VUELO_TOTORO.scrub,
        onUpdate: (self) => {
          secuencia.cargar();
          const p = self.progress;
          const t = gsap.parseEase('power1.inOut')(p);

          /* Punto de partida: la pieza tal como está fotografiada en la tarjeta,
             para que el sprite arranque solapado sobre ella y parezca salir de la
             propia pieza. */
          const origen = rectPiezaEnTarjeta(calib, self.start);
          if (!origen) return;
          const destino = medirSlot(origen.lado, self.end);

          const x = gsap.utils.interpolate(origen.centroX, destino.centroX, t);
          let y = gsap.utils.interpolate(origen.centroY, destino.centroY, t);
          const escala = gsap.utils.interpolate(
            origen.lado / LADO_SPRITE, destino.lado / LADO_SPRITE, t
          );

          /* Sube el sprite lo necesario para meter el borde superior del frame
             —donde se cortan las orejas— por detrás de la barra de navegación. */
          const rampa = rampaOrejas(p);
          if (rampa > 0) {
            const borde = y - (LADO_SPRITE / 2) * escala;
            const falta = Math.max(0, borde - (altoBarra() - VUELO_TOTORO.holguraBarra));
            y -= falta * rampa;
          }

          const aterrizo = p >= PROGRESO_LLEGADA;
          fijarLlegada(aterrizo); // el relevo: se apaga el sprite y se enciende la estática

          /* La figura ya salió volando: la tarjeta queda con la hoja vacía. */
          mostrarVacia(calib.indice, true);

          gsap.set(canvas, { x, y, scale: escala, autoAlpha: aterrizo ? 0 : 1 });
          secuencia.dibujar(cuadroSegunProgreso(p, cfg.cuadros));
        },
        onLeaveBack: () => {
          gsap.set(canvas, { autoAlpha: 0 });
          fijarLlegada(false);
          mostrarVacia(calib.indice, false); // la figura vuelve a la tarjeta
        },
        /* Deja el estado correcto si la página carga o se redimensiona con el
           contacto ya alcanzado, cuando onUpdate no llega a dispararse. */
        onRefresh: (self) => {
          fijarLlegada(window.scrollY >= self.end);
          mostrarVacia(calib.indice, window.scrollY >= self.start);
        }
      });
    }
  });
}

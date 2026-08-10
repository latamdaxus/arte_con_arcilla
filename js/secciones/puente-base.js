/* ============================================================================
   SECCIÓN — Andamiaje común de los puentes animados
   Los dos vuelos comparten todo el armado: preparar el canvas, crear la
   secuencia, precargarla antes de tiempo, y reconstruir el ScrollTrigger al
   redimensionar (porque las posiciones de aterrizaje se miden en píxeles).
   Lo único propio de cada uno es la coreografía, que llega como `crearTrigger`.
   ============================================================================ */

import { crearSecuencia, prepararCanvasSprite, pintorSprite } from '../nucleo/secuencia-frames.js';

/**
 * @param {object} opciones
 * @param {string} opciones.canvasId          id del canvas del sprite
 * @param {object} opciones.secuencia         { ruta, prefijo, cuadros }
 * @param {object} opciones.precarga          { trigger, start } del ScrollTrigger de precarga
 * @param {(ctx: {canvas: HTMLCanvasElement, secuencia: object}) => object} opciones.crearTrigger
 */
export function crearPuente({ canvasId, secuencia: cfg, precarga, crearTrigger }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  prepararCanvasSprite(canvas);
  const secuencia = crearSecuencia({
    ruta: cfg.ruta,
    prefijo: cfg.prefijo,
    cantidad: cfg.cuadros,
    dibujar: pintorSprite(canvas)
  });

  /* Precarga anticipada: los frames tienen que estar listos antes de que el
     vuelo empiece. */
  ScrollTrigger.create({
    trigger: precarga.trigger,
    start: precarga.start,
    once: true,
    onEnter: () => secuencia.cargar()
  });

  let trigger = null;

  function construir() {
    gsap.set(canvas, { autoAlpha: 0 });
    if (trigger) trigger.kill();
    trigger = crearTrigger({ canvas, secuencia });
  }

  requestAnimationFrame(() => requestAnimationFrame(construir));

  let temporizador;
  window.addEventListener('resize', () => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      ScrollTrigger.refresh();
      construir();
    }, 200);
  });
}

/** Índice de frame que corresponde a un progreso de vuelo. */
export const cuadroSegunProgreso = (progreso, cuadros) =>
  Math.min(cuadros - 1, Math.floor(progreso * cuadros));

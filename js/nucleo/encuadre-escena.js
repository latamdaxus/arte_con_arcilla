/* ============================================================================
   NÚCLEO — Proyección de la escena del taller a pantalla
   Una única transformación, usada tanto por el canvas del fondo como por el
   despegue del sprite de Van Gogh. Por eso el sprite calza sobre el plato en
   cualquier viewport sin recalibrar.
   ============================================================================ */

import {
  FRAME_ANCHO, FRAME_ALTO, PLATO_EN_FRAME, AIRE_PLATO
} from '../config/escena.js';

/**
 * Escala tipo "cover", pero nunca tanto como para recortar el plato. En una
 * pantalla vertical el cover puro se comería medio plato (y el sprite no
 * tendría contra qué calzar), así que ahí se limita la escala y quedan bandas
 * del color de la sección. Nunca deforma: la proporción del frame se respeta
 * siempre.
 */
export function encuadrarFrame(anchoVista, altoVista) {
  const cover = Math.max(anchoVista / FRAME_ANCHO, altoVista / FRAME_ALTO);
  const contain = Math.min(anchoVista / FRAME_ANCHO, altoVista / FRAME_ALTO);

  /* Semiejes del plato medidos desde el centro del frame (el recorte del cover
     es centrado), con un poco de aire alrededor. */
  const semiAncho = Math.max(
    Math.abs(PLATO_EN_FRAME.x - FRAME_ANCHO / 2),
    Math.abs(PLATO_EN_FRAME.x + PLATO_EN_FRAME.ancho - FRAME_ANCHO / 2)
  ) * AIRE_PLATO;
  const semiAlto = Math.max(
    Math.abs(PLATO_EN_FRAME.y - FRAME_ALTO / 2),
    Math.abs(PLATO_EN_FRAME.y + PLATO_EN_FRAME.alto - FRAME_ALTO / 2)
  ) * AIRE_PLATO;
  const sinRecortarPlato = Math.min(anchoVista / (2 * semiAncho), altoVista / (2 * semiAlto));

  const escala = Math.min(cover, Math.max(contain, sinRecortarPlato));
  const ancho = FRAME_ANCHO * escala;
  const alto = FRAME_ALTO * escala;
  return {
    escala,
    ancho,
    alto,
    x: (anchoVista - ancho) / 2,
    y: (altoVista - alto) / 2
  };
}

/**
 * Proyecta un rectángulo cuadrado dado en coordenadas de frame a coordenadas de
 * pantalla, usando el viewport actual.
 */
export function rectFrameAPantalla(rect) {
  const f = encuadrarFrame(window.innerWidth, window.innerHeight);
  return {
    centroX: f.x + (rect.x + rect.lado / 2) * f.escala,
    centroY: f.y + (rect.y + rect.lado / 2) * f.escala,
    lado: rect.lado * f.escala
  };
}

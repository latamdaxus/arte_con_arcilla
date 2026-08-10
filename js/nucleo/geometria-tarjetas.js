/* ============================================================================
   NÚCLEO — Geometría de las tarjetas de la colección
   Traduce "dónde está la pieza fotografiada en la tarjeta" a coordenadas de
   pantalla, para que los sprites despeguen y aterricen encima de ella.
   ============================================================================ */

import { ANCHO_MOVIL, LADO_SPRITE } from '../config/escena.js';
import { ESCALA_TARJETA_ACTIVA } from '../config/vuelos.js';

export const esMovil = () => window.innerWidth <= ANCHO_MOVIL;

export const tarjetaEn = (indice) =>
  document.querySelectorAll('.tarjeta')[indice] || null;

/**
 * Posición en pantalla que tendrá un elemento de flujo normal cuando el scroll
 * llegue a `scrollY`. Se usa en celular, donde la colección y el contacto no van
 * "pinneados" y por tanto sí se desplazan con la página.
 */
export function rectAlScroll(el, scrollY) {
  const r = el.getBoundingClientRect();
  return {
    ancho: r.width,
    alto: r.height,
    centroX: r.left + r.width / 2,
    centroY: r.top + window.scrollY + r.height / 2 - scrollY
  };
}

function cajaTarjeta() {
  const el = document.querySelector('.tarjeta .tarjeta__foto');
  if (!el) return null;
  const cs = getComputedStyle(el);
  return { el, ancho: parseFloat(cs.width), alto: parseFloat(cs.height) };
}

/**
 * Centro y tamaño de la tarjeta del carrusel donde aterriza/despega un sprite.
 * En desktop el contenedor va "pinneado" y la tarjeta activa queda centrada en
 * pantalla, así que el centro es fijo. En celular es una tira horizontal normal,
 * así que hay que proyectar dónde estará en el scroll indicado.
 */
export function rectTarjetaActiva(scrollY) {
  const contenedor = document.querySelector('.coleccion__pista');
  const caja = cajaTarjeta();
  if (!contenedor || !caja) return null;

  if (esMovil()) {
    const r = rectAlScroll(caja.el, scrollY);
    return { ancho: caja.ancho, alto: caja.alto, centroX: r.centroX, centroY: r.centroY };
  }
  const cr = contenedor.getBoundingClientRect();
  return {
    ancho: caja.ancho,
    alto: caja.alto,
    centroX: cr.left + cr.width / 2,
    centroY: window.innerHeight / 2
  };
}

/**
 * Rect en pantalla de la pieza fotografiada dentro de su tarjeta, respetando el
 * object-fit: cover con que se dibuja la foto. Devuelve además la caja visible
 * de la tarjeta, para poder recortar el sprite contra ella.
 */
export function rectPiezaEnTarjeta(calib, scrollY) {
  const tarjeta = tarjetaEn(calib.indice);
  const centro = rectTarjetaActiva(scrollY);
  if (!tarjeta || !centro) return null;

  const caja = tarjeta.querySelector('.tarjeta__foto');
  /* La foto de producto, no la capa de fondo vacío que va superpuesta. */
  const img = caja && caja.querySelector('img:not(.tarjeta__vacia)');
  if (!caja || !img || !img.naturalWidth) return null;

  const anchoCaja = caja.clientWidth;
  const altoCaja = caja.clientHeight;
  const anchoImg = img.naturalWidth;
  const altoImg = img.naturalHeight;
  if (!anchoCaja || !altoCaja) return null;

  const cover = Math.max(anchoCaja / anchoImg, altoCaja / altoImg);
  const medio = calib.lado * anchoImg * cover / 2;
  /* Desplazamiento del centro de la pieza respecto al centro de la tarjeta. */
  const dx = (anchoCaja - anchoImg * cover) / 2 + calib.x * anchoImg * cover + medio - anchoCaja / 2;
  const dy = (altoCaja - altoImg * cover) / 2 + calib.y * altoImg * cover + medio - altoCaja / 2;

  const k = esMovil() ? 1 : ESCALA_TARJETA_ACTIVA;
  const marco = tarjeta.querySelector('.tarjeta__marco') || caja;
  return {
    centroX: centro.centroX + dx * k,
    centroY: centro.centroY + dy * k,
    lado: calib.lado * anchoImg * cover * k,
    caja: {
      centroX: centro.centroX,
      centroY: centro.centroY,
      ancho: anchoCaja * k,
      alto: altoCaja * k,
      radio: (parseFloat(getComputedStyle(marco).borderTopLeftRadius) || 0) * k
    }
  };
}

/**
 * Recorta el canvas del sprite contra la caja de la tarjeta. La foto de la
 * tarjeta recorta la pieza (el object-fit: cover se come los costados), así que
 * al aterrizar con el mismo tamaño el sprite asomaría por fuera de la tarjeta.
 * `t` va de 0 (sin recorte, en pleno vuelo) a 1 (recortado como la tarjeta).
 */
export function recortarContraTarjeta(canvas, caja, x, y, escala, t) {
  if (t <= 0 || !caja || !escala) {
    canvas.style.clipPath = '';
    return;
  }
  const aLocalX = (v) => (v - x) / escala + LADO_SPRITE / 2;
  const aLocalY = (v) => (v - y) / escala + LADO_SPRITE / 2;
  const izq = Math.max(0, aLocalX(caja.centroX - caja.ancho / 2));
  const arr = Math.max(0, aLocalY(caja.centroY - caja.alto / 2));
  const der = Math.max(0, LADO_SPRITE - aLocalX(caja.centroX + caja.ancho / 2));
  const aba = Math.max(0, LADO_SPRITE - aLocalY(caja.centroY + caja.alto / 2));
  const r = caja.radio / escala;
  canvas.style.clipPath =
    `inset(${arr * t}px ${der * t}px ${aba * t}px ${izq * t}px round ${r * t}px)`;
}

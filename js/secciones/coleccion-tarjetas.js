/* ============================================================================
   SECCIÓN — Estado de las tarjetas de la colección
   Dos cosas que acompañan a los vuelos: la capa con la foto sin la pieza (para
   que no se vea la pieza dos veces) y la "apertura" del marco de la tarjeta 1
   cuando recibe el plato.
   ============================================================================ */

import { SPRITE_EN_TARJETA, AIRE_APERTURA, CIERRE_MARCO } from '../config/vuelos.js';
import { esMovil, tarjetaEn } from '../nucleo/geometria-tarjetas.js';

/** Muestra u oculta la capa con la foto sin la pieza. */
export function mostrarVacia(indice, valor) {
  const tarjeta = tarjetaEn(indice);
  const caja = tarjeta && tarjeta.querySelector('.tarjeta__foto');
  if (caja) caja.classList.toggle('is-empty', valor);
}

/**
 * Los `sin-*` pesan ~1.5 MB, bastante más que los `prod-*`. Se precargan y sólo
 * se les pone el src una vez decodificados, para que el intercambio no parpadee.
 * Se dispara mucho antes de que la colección aparezca.
 */
export function precargarFondosVacios() {
  let hecho = false;
  const cargar = () => {
    if (hecho) return;
    hecho = true;
    document.querySelectorAll('.tarjeta__vacia').forEach((el) => {
      const src = el.dataset.empty;
      if (!src) return;
      const previa = new Image();
      previa.src = src;
      const asignar = () => { el.src = src; };
      if (previa.decode) previa.decode().then(asignar).catch(asignar);
      else previa.onload = asignar;
    });
  };
  ScrollTrigger.create({ trigger: '#scrollytelling', start: '15% top', once: true, onEnter: cargar });
}

/**
 * Ancho normal y ancho "abierto" del marco de una tarjeta. El abierto es el
 * mínimo que hace falta para que el cover deje de recortar la pieza.
 */
function anchosDelMarco(calib) {
  const tarjeta = tarjetaEn(calib.indice);
  const caja = tarjeta && tarjeta.querySelector('.tarjeta__foto');
  const img = caja && caja.querySelector('img:not(.tarjeta__vacia)');
  if (!tarjeta || !img || !img.naturalWidth) return null;

  const normal = tarjeta.clientWidth;
  const alto = tarjeta.clientHeight;
  const anchoImg = img.naturalWidth;
  const altoImg = img.naturalHeight;

  /* Semiancho de la pieza respecto al centro de la foto, en fracción. */
  const semi = Math.max(0.5 - calib.pieza.x0, calib.pieza.x1 - 0.5);
  /* Ancho de ventana (en px de la foto) que hace falta para no recortarla. */
  const necesario = 2 * semi * anchoImg * AIRE_APERTURA;
  /* Con el alto fijo, el cover lo gobierna la altura mientras no la supere. */
  const abierto = necesario * (alto / altoImg);

  return { normal, abierto: Math.max(normal, Math.min(abierto, anchoImg * (alto / altoImg))) };
}

/**
 * La tarjeta 1 recibe el plato "abierta": el marco se ensancha lo justo para que
 * el cover deje de recortar la pieza y se vea completa, y se va cerrando con el
 * scroll hasta el ancho normal. Como el marco va en absoluto y centrado,
 * ensancharlo no mueve nada del carrusel.
 */
export function iniciarAperturaDeTarjeta() {
  const calib = SPRITE_EN_TARJETA.vanGogh;
  const tarjeta = tarjetaEn(calib.indice);
  const marco = tarjeta && tarjeta.querySelector('.tarjeta__marco');
  if (!marco) return;

  function aplicar(apertura) {
    if (esMovil()) { marco.style.width = ''; return; }
    const anchos = anchosDelMarco(calib);
    if (!anchos) return;
    marco.style.width = gsap.utils.interpolate(anchos.normal, anchos.abierto, apertura) + 'px';
  }

  ScrollTrigger.create({
    trigger: '#coleccion',
    start: 'top top',   // el instante del aterrizaje: marco abierto del todo
    end: CIERRE_MARCO,  // se cierra durante el primer tramo del recorrido
    scrub: 1,
    onUpdate: (self) => aplicar(1 - self.progress),
    onLeaveBack: () => aplicar(1),
    onLeave: () => aplicar(0),
    onRefresh: (self) => aplicar(
      window.scrollY <= self.start ? 1
        : window.scrollY >= self.end ? 0
          : 1 - (window.scrollY - self.start) / (self.end - self.start)
    )
  });
}

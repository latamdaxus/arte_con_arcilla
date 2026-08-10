/* ============================================================================
   SECCIÓN — Carrusel de la colección
   Desplaza la pista horizontal con el scroll y aplica profundidad de campo:
   la tarjeta más cercana al centro queda grande y nítida, el resto se achica,
   se atenúa y se desenfoca. También actualiza el contador del sidebar.
   ============================================================================ */

import { CARRUSEL } from '../config/vuelos.js';
import { esMovil } from '../nucleo/geometria-tarjetas.js';

export function iniciarCarrusel() {
  const pista = document.getElementById('collectionCarouselTrack');
  const tarjetas = Array.from(document.querySelectorAll('.tarjeta'));
  const numEl = document.getElementById('active-card-num');
  /* Estos dos id conservan su nombre original a propósito: son el contrato con
     el HTML y no siguen la convención de clases. */
  const barraEl = document.getElementById('collection-progressbar-fill');
  const nombreEl = document.getElementById('collection-card-name');

  if (!pista || tarjetas.length === 0) return;

  const NOMBRES = tarjetas.map((c) => c.dataset.name);
  const TOTAL = tarjetas.length;

  /* Estado inicial de profundidad de campo: la primera tarjeta arranca activa
     (en el centro) y el resto atenuado y borroso. */
  gsap.set(tarjetas[0], { scale: CARRUSEL.escalaActiva, opacity: 1, filter: 'blur(0px)' });
  tarjetas.slice(1).forEach((c) => {
    gsap.set(c, {
      scale: CARRUSEL.escalaLejana,
      opacity: CARRUSEL.opacidadInicialLejana,
      filter: `blur(${CARRUSEL.desenfoqueInicialLejano}px)`
    });
  });

  let instancia = null;

  function construir() {
    if (esMovil()) {
      /* En celular la tira se scrollea a mano: se limpia todo lo del GSAP. */
      if (instancia) {
        instancia.kill();
        instancia = null;
      }
      gsap.set(pista, { x: 0 });
      tarjetas.forEach((c) => gsap.set(c, { scale: 1, opacity: 1, filter: 'blur(0px)' }));
      return;
    }

    const contenedor = document.querySelector('.coleccion__pista');
    const rectContenedor = contenedor.getBoundingClientRect();
    const centroContenedor = rectContenedor.left + rectContenedor.width / 2;

    /* Cuánto hay que mover la pista para centrar cada tarjeta, medido sin
       transform activo. */
    gsap.set(pista, { x: 0 });
    const desplazamientos = tarjetas.map((tarjeta) => {
      const r = tarjeta.getBoundingClientRect();
      return centroContenedor - (r.left + r.width / 2);
    });

    const xInicial = desplazamientos[0];
    const xFinal = desplazamientos[TOTAL - 1];
    gsap.set(pista, { x: xInicial });

    if (instancia) instancia.kill();

    instancia = ScrollTrigger.create({
      trigger: '#coleccion',
      start: 'top top',
      end: 'bottom bottom',
      pin: '.coleccion__fijo',
      pinSpacing: false,
      scrub: CARRUSEL.scrub,
      onUpdate: (self) => {
        gsap.set(pista, { x: gsap.utils.interpolate(xInicial, xFinal, self.progress) });

        const rectAhora = contenedor.getBoundingClientRect();
        const centroAhora = rectAhora.left + rectAhora.width / 2;
        const radio = rectAhora.width * CARRUSEL.radioInfluencia;

        let menorDistancia = Infinity;
        let indiceActivo = 0;

        tarjetas.forEach((tarjeta, i) => {
          const r = tarjeta.getBoundingClientRect();
          const distancia = Math.abs(r.left + r.width / 2 - centroAhora);
          const t = Math.min(distancia / radio, 1); // 0 = centro, 1 = lejos

          gsap.set(tarjeta, {
            scale: gsap.utils.interpolate(CARRUSEL.escalaActiva, CARRUSEL.escalaLejana, t),
            opacity: gsap.utils.interpolate(CARRUSEL.opacidadActiva, CARRUSEL.opacidadLejana, t),
            filter: `blur(${gsap.utils.interpolate(0, CARRUSEL.desenfoqueLejano, t)}px)`
          });

          if (distancia < menorDistancia) {
            menorDistancia = distancia;
            indiceActivo = i;
          }
        });

        const numero = String(indiceActivo + 1).padStart(2, '0');
        if (numEl && numEl.textContent !== numero) numEl.textContent = numero;
        if (nombreEl && nombreEl.textContent !== NOMBRES[indiceActivo]) {
          nombreEl.textContent = NOMBRES[indiceActivo];
        }
        if (barraEl) {
          barraEl.style.width = ((indiceActivo + 1) / TOTAL) * 100 + '%';
        }
      }
    });
  }

  /* Se espera un par de frames para que el layout esté pintado y los
     getBoundingClientRect() sean correctos. */
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

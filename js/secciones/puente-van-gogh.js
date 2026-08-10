/* ============================================================================
   SECCIÓN — Puente Van Gogh
   El plato se despega de la mesa del taller y aterriza dentro de la primera
   tarjeta de la colección, con el tamaño y la posición que tiene la pieza en la
   foto de esa tarjeta.
   ============================================================================ */

import { SECUENCIAS, SPRITE_EN_FRAME, LADO_SPRITE } from '../config/escena.js';
import { SPRITE_EN_TARJETA, VUELO_VAN_GOGH, PROGRESO_LLEGADA } from '../config/vuelos.js';
import { rectFrameAPantalla } from '../nucleo/encuadre-escena.js';
import { esMovil, rectPiezaEnTarjeta, recortarContraTarjeta } from '../nucleo/geometria-tarjetas.js';
import { crearPuente, cuadroSegunProgreso } from './puente-base.js';
import { mostrarVacia } from './coleccion-tarjetas.js';

export function iniciarPuenteVanGogh() {
  const calib = SPRITE_EN_TARJETA.vanGogh;
  const cfg = SECUENCIAS.vanGogh;

  crearPuente({
    canvasId: 'vanGoghCanvas',
    secuencia: cfg,
    precarga: { trigger: '#scrollytelling', start: '35% top' },
    crearTrigger: ({ canvas, secuencia }) => {
      const movil = esMovil();

      return ScrollTrigger.create({
        /* Arranca cuando la secuencia principal ya llegó a su último frame (y el
           paso "Esmaltado" se desvaneció). En desktop termina justo cuando
           arranca la colección (la tarjeta ya está centrada por el pin); en
           celular, cuando la primera tarjeta queda centrada en pantalla. */
        trigger: '#scrollytelling',
        start: 'bottom bottom',
        endTrigger: movil ? '.tarjeta .tarjeta__foto' : '#coleccion',
        end: movil ? 'center center' : 'top top',
        scrub: VUELO_VAN_GOGH.scrub,
        onUpdate: (self) => {
          secuencia.cargar();
          const p = self.progress;

          /* Destino: la pieza tal como está fotografiada en la tarjeta, para que
             el plato aterrice con su mismo tamaño y posición. */
          const destino = rectPiezaEnTarjeta(calib, self.end);
          if (!destino) return;

          /* Punto de partida: el sprite calcado sobre el plato del fondo. Se
             deriva de la misma proyección que usa el canvas del taller, así que
             coincide en cualquier viewport sin recalibrar. */
          const origen = rectFrameAPantalla(SPRITE_EN_FRAME);
          const escalaOrigen = origen.lado / LADO_SPRITE;
          const escalaDestino = destino.lado / LADO_SPRITE;
          const escalaPico = escalaOrigen * VUELO_VAN_GOGH.crecimientoDespegue;
          const alturaPico = origen.centroY - origen.lado * VUELO_VAN_GOGH.elevacionDespegue;

          let x, y, escala;
          if (p < VUELO_VAN_GOGH.finFaseDespegue) {
            /* Fase 1: despega creciendo un poco, sin moverse del plato. */
            const t = gsap.parseEase('power1.out')(p / VUELO_VAN_GOGH.finFaseDespegue);
            escala = gsap.utils.interpolate(escalaOrigen, escalaPico, t);
            x = origen.centroX;
            y = gsap.utils.interpolate(origen.centroY, alturaPico, t);
          } else {
            /* Fase 2: viaja y se ajusta al tamaño de la pieza de la tarjeta. */
            const t = gsap.parseEase('power2.inOut')(
              (p - VUELO_VAN_GOGH.finFaseDespegue) / (1 - VUELO_VAN_GOGH.finFaseDespegue)
            );
            escala = gsap.utils.interpolate(escalaPico, escalaDestino, t);
            x = gsap.utils.interpolate(origen.centroX, destino.centroX, t);
            y = gsap.utils.interpolate(alturaPico, destino.centroY, t);
          }

          /* Opaco desde el primer instante: como arranca calcado sobre el plato,
             el relevo es invisible y se lee como continuidad. */
          const aterrizo = p >= PROGRESO_LLEGADA;

          /* Hasta el aterrizaje la tarjeta muestra la tela vacía: si mostrara la
             pieza, se verían dos platos a la vez mientras el sprite cae. */
          mostrarVacia(calib.indice, !aterrizo);

          /* El recorte contra la tarjeta entra sólo en el tramo final, cuando el
             plato ya está prácticamente encajado. */
          recortarContraTarjeta(canvas, destino.caja, x, y, escala,
            gsap.utils.clamp(0, 1, (p - VUELO_VAN_GOGH.recorteDesde) / VUELO_VAN_GOGH.recorteRango));

          gsap.set(canvas, { x, y, scale: escala, autoAlpha: aterrizo ? 0 : 1 });
          secuencia.dibujar(cuadroSegunProgreso(p, cfg.cuadros));
        },
        onLeaveBack: () => {
          gsap.set(canvas, { autoAlpha: 0 });
          canvas.style.clipPath = '';
          mostrarVacia(calib.indice, true);
        },
        onRefresh: (self) => mostrarVacia(calib.indice, window.scrollY < self.end)
      });
    }
  });
}

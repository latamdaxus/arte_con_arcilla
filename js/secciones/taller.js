/* ============================================================================
   SECCIÓN — El taller
   Barre la secuencia de frames con el scroll, revela los paneles de texto y
   sostiene el último frame hasta el despegue del sprite.
   ============================================================================ */

import { SECUENCIAS } from '../config/escena.js';
import { crearSecuencia } from '../nucleo/secuencia-frames.js';
import { encuadrarFrame } from '../nucleo/encuadre-escena.js';

export function iniciarTaller() {
  const canvas = document.getElementById('scrollCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const cfg = SECUENCIAS.taller;
  const avance = { cuadro: 0 };

  /* Cuando es true el fondo reposa en p_193 (mesa vacía) en vez de seguir el
     barrido. Lo conmuta el ScrollTrigger del despegue, en ambos sentidos. */
  let mesaVacia = false;

  /* El frame se dibuja completo y proporcional; lo que se salga del canvas lo
     recorta el propio canvas. */
  const secuencia = crearSecuencia({
    ruta: cfg.ruta,
    prefijo: cfg.prefijo,
    cantidad: cfg.total,
    dibujar: (img) => {
      const f = encuadrarFrame(canvas.width, canvas.height);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, f.x, f.y, f.ancho, f.alto);
    }
  });

  const cuadroActual = () => (mesaVacia ? cfg.cuadroMesaVacia : Math.floor(avance.cuadro));
  const pintarEscena = () => secuencia.dibujar(cuadroActual());

  function ajustarCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    pintarEscena();
  }

  function fijarMesaVacia(valor) {
    if (mesaVacia === valor) return;
    mesaVacia = valor;
    pintarEscena();
  }

  secuencia.cargar();
  window.addEventListener('resize', ajustarCanvas);
  ajustarCanvas();

  // --- Barrido de la secuencia con el scroll ---
  gsap.to(avance, {
    cuadro: cfg.cuadros - 1,
    snap: 'cuadro',
    ease: 'none',
    scrollTrigger: {
      trigger: '#scrollytelling',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 0.5 // inercia suave
    },
    onUpdate: pintarEscena
  });

  /* Mesa vacía: el fondo sostiene p_192 durante todo el barrido y recién pasa a
     p_193 en el instante del despegue del sprite —el mismo punto donde arranca el
     vuelo de Van Gogh, "bottom bottom" de #scrollytelling—, de modo que el plato
     parezca levantarse de la mesa. Si no se atara a ese punto, la mesa se
     vaciaría casi una pantalla antes y quedaría un tramo con la mesa vacía y nada
     volando. Al scrollear hacia arriba vuelve a p_192. */
  ScrollTrigger.create({
    trigger: '#scrollytelling',
    start: 'bottom bottom',
    end: 'bottom top', // mientras el taller sigue a la vista
    onEnter: () => fijarMesaVacia(true),
    onEnterBack: () => fijarMesaVacia(true),
    onLeaveBack: () => fijarMesaVacia(false),
    /* Deja el estado correcto si la página carga (o se redimensiona) ya pasada la
       marca, cuando onEnter no llega a dispararse. */
    onRefresh: (self) => fijarMesaVacia(window.scrollY >= self.start)
  });

  iniciarPaneles();
}

/**
 * Aparición y desaparición de los paneles de texto, sincronizadas con el
 * porcentaje de scroll de la sección.
 */
function iniciarPaneles() {
  const linea = gsap.timeline({
    scrollTrigger: {
      trigger: '#scrollytelling',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true
    }
  });

  /* El hero ya está visible por defecto; se desvanece del 15% al 22%. */
  linea.to('#panelHero', {
    opacity: 0, y: -50, autoAlpha: 0, ease: 'power1.inOut', duration: 0.07
  }, 0.15);

  /* Cada paso entra y sale en su tramo. */
  const pasos = [
    { id: '#panelMoldear', entra: 0.25, sale: 0.42 },
    { id: '#panelSecar', entra: 0.48, sale: 0.65 },
    { id: '#panelEsmaltado', entra: 0.70, sale: 0.88 }
  ];

  pasos.forEach(({ id, entra, sale }) => {
    linea.fromTo(id,
      { opacity: 0, y: 50, autoAlpha: 0 },
      { opacity: 1, y: 0, autoAlpha: 1, ease: 'power1.inOut', duration: 0.05 },
      entra
    );
    linea.to(id, {
      opacity: 0, y: -50, autoAlpha: 0, ease: 'power1.inOut', duration: 0.05
    }, sale);
  });
}

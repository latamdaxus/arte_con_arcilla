/* ============================================================================
   NÚCLEO — Motor genérico de secuencias de frames sobre canvas
   Una sola implementación para las tres secuencias (el taller y los dos
   sprites). Lo único que cambia entre ellas es cómo se pinta cada imagen, así
   que eso se recibe como callback `dibujar`.

   Resuelve dos problemas que tenían las versiones sueltas:
   - Descarga en orden y con concurrencia limitada, porque pedir los ~192 frames
     de golpe saturaba la conexión y el servidor los rechazaba.
   - Redibujado diferido: si el frame pedido aún no llegó, se pinta el más
     cercano ya descargado y se vuelve a pintar en cuanto llega uno mejor. Sin
     esto el canvas quedaba en blanco al entrar por primera vez, porque el
     scroll ya había dejado de emitir eventos cuando las imágenes terminaban de
     llegar.
   ============================================================================ */

import { CONCURRENCIA_DESCARGA, LADO_SPRITE } from '../config/escena.js';

const rellenar = (n) => ('000' + n).slice(-3);

/**
 * @param {object} opciones
 * @param {string} opciones.ruta       carpeta de la secuencia
 * @param {string} opciones.prefijo    prefijo del archivo (p, v, t)
 * @param {number} opciones.cantidad   cuántos frames tiene la secuencia
 * @param {(img: HTMLImageElement) => void} opciones.dibujar
 */
export function crearSecuencia({ ruta, prefijo, cantidad, dibujar }) {
  const imagenes = [];
  let indiceObjetivo = 0;
  let indicePintado = -1;
  let iniciada = false;

  const disponible = (i) => {
    const img = imagenes[i];
    return !!img && img.complete && img.naturalWidth > 0;
  };

  /* Si el frame exacto aún no llegó, usa el más cercano ya descargado: así la
     animación se degrada (va "a saltos") en vez de dejar el canvas en blanco. */
  function elegirDibujable(indice) {
    if (disponible(indice)) return indice;
    for (let d = 1; d < cantidad; d++) {
      if (indice - d >= 0 && disponible(indice - d)) return indice - d;
      if (indice + d < cantidad && disponible(indice + d)) return indice + d;
    }
    return -1;
  }

  function pintar(indice) {
    const i = elegirDibujable(indice);
    if (i < 0) return; // queda en pantalla el frame anterior
    indicePintado = i;
    dibujar(imagenes[i]);
  }

  return {
    /** Arranca la descarga. Idempotente. */
    cargar() {
      if (iniciada) return;
      iniciada = true;
      let siguiente = 0;

      const pedirUno = () => {
        if (siguiente >= cantidad) return;
        const i = siguiente++;
        const img = new Image();
        imagenes[i] = img;
        const alTerminar = () => {
          /* Redibuja si este frame recién llegado se acerca más al objetivo que
             el que está actualmente en pantalla. */
          const mejora = indicePintado < 0 ||
            Math.abs(i - indiceObjetivo) < Math.abs(indicePintado - indiceObjetivo);
          if (mejora) pintar(indiceObjetivo);
          pedirUno();
        };
        img.onload = alTerminar;
        img.onerror = alTerminar;
        img.src = `${ruta}/${prefijo}_${rellenar(i + 1)}.webp`;
      };

      for (let k = 0; k < CONCURRENCIA_DESCARGA; k++) pedirUno();
    },

    /** Pide dibujar un frame concreto. */
    dibujar(indice) {
      indiceObjetivo = indice;
      pintar(indice);
    },

    /** Vuelve a pintar el último frame pedido (p. ej. tras un resize). */
    repintar() {
      pintar(indiceObjetivo);
    }
  };
}

/**
 * Deja un canvas listo para hacer de sprite: cuadrado, con la densidad de la
 * pantalla, anclado por su centro y oculto.
 */
export function prepararCanvasSprite(canvas) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = LADO_SPRITE * dpr;
  canvas.height = LADO_SPRITE * dpr;
  canvas.style.width = LADO_SPRITE + 'px';
  canvas.style.height = LADO_SPRITE + 'px';
  gsap.set(canvas, { xPercent: -50, yPercent: -50, transformOrigin: 'center center', autoAlpha: 0 });
}

/** Devuelve el `dibujar` que pinta un frame ocupando todo un canvas de sprite. */
export function pintorSprite(canvas) {
  const ctx = canvas.getContext('2d');
  return (img) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  };
}

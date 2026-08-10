/* ============================================================================
   CONFIGURACIÓN — Geometría y assets de la escena del taller
   Todo lo que tenga que calzar con el fondo se expresa en "coordenadas de
   frame" (el sistema de 1280x720 de los WebP) y se proyecta a pantalla con
   nucleo/encuadre-escena.js. Así el fondo y los sprites usan exactamente la
   misma transformación y calzan en cualquier viewport.
   ============================================================================ */

/** Ancho de la pantalla a partir del cual se considera celular. */
export const ANCHO_MOVIL = 768;

/** Resolución nativa de los frames del taller. */
export const FRAME_ANCHO = 1280;
export const FRAME_ALTO = 720;

/** Lado (en px CSS) de los canvas cuadrados de los sprites. */
export const LADO_SPRITE = 640;

/** Descargas simultáneas por secuencia. Pedir los ~192 frames de golpe agota el
    límite de conexiones por host de HTTP/1.1 (6) y deja en cola indefinidamente
    cualquier imagen posterior. */
export const CONCURRENCIA_DESCARGA = 6;

export const SECUENCIAS = {
  taller: {
    ruta: 'assets/frames/principal-frames',
    prefijo: 'p',
    /* El barrido con scroll va de p_001 a p_192: p_192 es la toma con el plato
       sobre la mesa, y es contra ella que está calibrado el despegue del sprite. */
    cuadros: 192,
    /* p_193 es la misma escena con la mesa vacía y queda FUERA del barrido: se
       muestra recién en el instante del despegue, para que el plato parezca
       levantarse. Mide 1672x941 en vez de 1280x720, pero conserva la proporción,
       así que se dibuja por el mismo camino. */
    cuadroMesaVacia: 192,
    total: 193
  },
  vanGogh: {
    ruta: 'assets/frames/van-gogh-frames_sin_fondo',
    prefijo: 'v',
    cuadros: 192
  },
  totoro: {
    ruta: 'assets/frames/totoro-frames_sin_fondo',
    prefijo: 't',
    cuadros: 192
  }
};

/** Dónde cae el canvas completo del sprite (720x720) dentro del frame del
    taller, y qué parte de ese cuadrado ocupa el plato pintado. Calibrado por
    correlación cruzada de v_001 contra p_192 (escala 0.875). */
export const SPRITE_EN_FRAME = { x: 345.88, y: 54.25, lado: 630 };
export const PLATO_EN_FRAME = { x: 408, y: 112, ancho: 520, alto: 508 };

/** Aire que se le deja al plato al limitar la escala del fondo, para que el
    recorte tipo "cover" nunca se lo coma. */
export const AIRE_PLATO = 1.04;

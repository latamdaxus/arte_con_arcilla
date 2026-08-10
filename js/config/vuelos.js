/* ============================================================================
   CONFIGURACIÓN — Calibración de los vuelos y de las tarjetas
   Valores de ajuste de las dos transiciones animadas. Están todos acá, con
   nombre, para poder retocar el movimiento sin entrar en la lógica.
   ============================================================================ */

/** Dónde cae el canvas 720x720 del sprite dentro de la foto de producto de su
    tarjeta, en fracciones del tamaño natural de la foto (x del ancho, y del
    alto, lado del ancho porque el canvas es cuadrado en px de la foto).
    Calibrado por correlación cruzada del primer frame de cada secuencia contra
    la foto: así el sprite queda superpuesto a la pieza fotografiada, con su
    tamaño y su posición, en vez de centrado sobre la tarjeta.

    `pieza` es la caja de la pieza en la misma foto, también en fracciones: se
    usa para calcular cuánto hay que ensanchar el marco de la tarjeta para que
    el "cover" deje de recortarla. */
export const SPRITE_EN_TARJETA = {
  vanGogh: {
    indice: 0,
    x: -0.04837,
    y: 0.00295,
    lado: 1.04479,
    pieza: { x0: 0.05468, x1: 0.91693, y0: 0.09562, y1: 0.91150 }
  },
  totoro: {
    indice: 3,
    x: 0.14765,
    y: 0.02272,
    lado: 0.71411,
    pieza: { x0: 0.35890, x1: 0.68201, y0: 0.13286, y1: 0.57607 }
  }
};

/** Escala con la que el carrusel dibuja la tarjeta activa. La pieza fotografiada
    se agranda con ella. Debe coincidir con CARRUSEL.escalaActiva. */
export const ESCALA_TARJETA_ACTIVA = 1.05;

/** Profundidad de campo del carrusel. */
export const CARRUSEL = {
  escalaActiva: 1.05,
  escalaLejana: 0.82,
  opacidadActiva: 1,
  opacidadLejana: 0.32,
  desenfoqueLejano: 6,
  /** Radio de influencia, como fracción del ancho del contenedor. */
  radioInfluencia: 0.7,
  /** Estado inicial antes de que el carrusel se construya. */
  opacidadInicialLejana: 0.35,
  desenfoqueInicialLejano: 5,
  scrub: 1.2
};

/** Progreso a partir del cual se considera que el sprite ya llegó y se hace el
    relevo con el elemento estático. */
export const PROGRESO_LLEGADA = 0.995;

export const VUELO_VAN_GOGH = {
  /** Fin de la fase 1 (despega creciendo, sin moverse del plato). */
  finFaseDespegue: 0.22,
  /** Cuánto crece en la fase 1. */
  crecimientoDespegue: 1.18,
  /** Cuánto sube en la fase 1, como fracción de su lado. */
  elevacionDespegue: 0.04,
  /** Tramo en el que entra el recorte contra la caja de la tarjeta. */
  recorteDesde: 0.82,
  recorteRango: 0.18,
  scrub: 1
};

export const VUELO_TOTORO = {
  /** Cuánto crece el sprite entre el despegue y el aterrizaje en contacto. */
  crecimiento: 1.3,
  /** Topes del tamaño final, como fracción del viewport. */
  topeAncho: 0.44,
  topeAlto: 0.78,
  /** En t_038..t_067 las orejas quedan cortadas por el borde del frame. En ese
      tramo se levanta el sprite lo justo para que el corte quede tapado por la
      barra de navegación, con entrada y salida suaves. Se expresa en índice de
      cuadro; el módulo lo pasa a progreso. */
  cuadroCorteDesde: 37,
  cuadroCorteHasta: 67,
  rampaEntrada: 0.09,
  rampaSalida: 0.10,
  /** Cuánto se mete el borde por encima de la barra de navegación. */
  holguraBarra: 6,
  scrub: 1
};

/** Aire que se le deja a la pieza al ensanchar el marco de la tarjeta. */
export const AIRE_APERTURA = 1.03;

/** Tramo del recorrido de la colección en el que el marco de la tarjeta 1 se
    cierra desde abierto hasta su ancho normal. */
export const CIERRE_MARCO = '25% top';

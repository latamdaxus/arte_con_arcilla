/* ============================================================================
   PUNTO DE ENTRADA
   Único lugar con efectos: cada módulo exporta una función de inicio y acá se
   orquesta el orden. El orden importa porque los ScrollTrigger se recalculan en
   el orden en que se crean, y el carrusel es el que "pinnea" su sección.

   GSAP y ScrollTrigger llegan por CDN como scripts clásicos, así que están en el
   ámbito global antes de que corra este módulo (los módulos se ejecutan
   diferidos, después de parsear el documento).
   ============================================================================ */

import { iniciarTaller } from './secciones/taller.js';
import { iniciarCarrusel } from './secciones/coleccion-carrusel.js';
import { precargarFondosVacios, iniciarAperturaDeTarjeta } from './secciones/coleccion-tarjetas.js';
import { iniciarPuenteVanGogh } from './secciones/puente-van-gogh.js';
import { iniciarPuenteTotoro } from './secciones/puente-totoro.js';
import { iniciarNavegacion } from './ui/navegacion.js';
import { iniciarRevelado } from './ui/revelado.js';

gsap.registerPlugin(ScrollTrigger);

// 1. Scrollytelling del taller: secuencia de frames y paneles de texto.
iniciarTaller();

// 2. Carrusel de la colección (crea el pin de la sección).
iniciarCarrusel();

// 3. Estado de las tarjetas, que acompaña a los vuelos.
precargarFondosVacios();
iniciarAperturaDeTarjeta();

// 4. Los dos vuelos de sprites entre secciones.
iniciarPuenteVanGogh();
iniciarPuenteTotoro();

// 5. Interfaz general.
iniciarNavegacion();
iniciarRevelado();

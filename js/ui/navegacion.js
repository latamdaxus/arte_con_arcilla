/* ============================================================================
   UI — Navegación
   Fondo de la barra al hacer scroll, menú desplegable de celular y resaltado del
   enlace de la sección visible.
   ============================================================================ */

/** A partir de cuántos píxeles de scroll la barra pasa a fondo opaco. */
const UMBRAL_FONDO = 50;

export function iniciarNavegacion() {
  const barra = document.getElementById('navbar');
  const enlaces = document.getElementById('navLinks');
  const boton = document.getElementById('navToggle');
  if (!barra || !enlaces) return;

  // --- Fondo de la barra ---
  window.addEventListener('scroll', () => {
    barra.classList.toggle('is-scrolled', window.scrollY > UMBRAL_FONDO);
  });

  // --- Menú de celular ---
  if (boton) {
    boton.addEventListener('click', () => {
      enlaces.classList.toggle('is-active');
      boton.classList.toggle('is-active');
    });
  }

  const cerrarMenu = () => {
    enlaces.classList.remove('is-active');
    if (boton) boton.classList.remove('is-active');
  };
  enlaces.querySelectorAll('a').forEach((a) => a.addEventListener('click', cerrarMenu));

  iniciarEnlaceActivo(enlaces);
}

/** Marca el enlace de la sección por la que va pasando el scroll. */
function iniciarEnlaceActivo(enlaces) {
  const secciones = document.querySelectorAll('section[id]');
  const items = enlaces.querySelectorAll('a');

  window.addEventListener('scroll', () => {
    let actual = '';
    secciones.forEach((seccion) => {
      if (window.scrollY >= seccion.offsetTop - 100) actual = seccion.getAttribute('id');
    });

    items.forEach((item) => {
      item.style.color = '';
      if (item.getAttribute('href') === `#${actual}`) {
        item.style.color = 'var(--terracota)';
      }
    });
  });
}

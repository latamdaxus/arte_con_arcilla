/* ============================================================================
   UI — Revelado al entrar en viewport
   Agrega .is-visible a los elementos con las utilidades de revelado la primera vez
   que asoman en pantalla. El movimiento en sí lo define el CSS.
   ============================================================================ */

const OPCIONES = {
  root: null,
  rootMargin: '0px',
  threshold: 0.15
};

export function iniciarRevelado() {
  const observador = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (!entrada.isIntersecting) return;
      entrada.target.classList.add('is-visible');
      observador.unobserve(entrada.target);
    });
  }, OPCIONES);

  document
    .querySelectorAll('.revelar, .revelar--izq, .revelar--der')
    .forEach((el) => observador.observe(el));
}

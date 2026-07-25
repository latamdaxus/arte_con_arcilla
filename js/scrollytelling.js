// Registrar ScrollTrigger con GSAP
gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById('scrollCanvas');
const ctx = canvas.getContext('2d');

const frameCount = 193;
const images = [];
const frameSequence = { frame: 0 };

const pad = (num, size) => ('000' + num).slice(-size);

// Cargar primer frame inmediatamente
const firstImg = new Image();
firstImg.src = `assets/fames/principal-frames/p_001.webp`;
images[0] = firstImg;
firstImg.onload = () => {
  drawFrame(0);
};

// Cargar el resto de frames en segundo plano
for (let i = 1; i <= frameCount; i++) {
  if (i === 1) continue;
  const img = new Image();
  img.src = `assets/fames/principal-frames/p_${pad(i, 3)}.webp`;
  img.onload = () => {
    const currentFrame = Math.floor(frameSequence.frame);
    if (currentFrame === i - 1) {
      drawFrame(currentFrame);
    }
  };
  images[i - 1] = img;
}

// Dibujar frame en canvas con equivalencia a object-fit: cover
function drawImageProp(ctx, img, x, y, w, h, offsetX = 0.5, offsetY = 0.5) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  
  if (iw === 0 || ih === 0) return;

  const r = Math.min(w / iw, h / ih);
  let nw = iw * r;
  let nh = ih * r;
  
  if (nw < w) nw = iw * (w / iw);
  if (nh < h) nh = ih * (h / ih);
  
  const cw = iw / (nw / w);
  const ch = ih / (nh / h);
  
  const cx = (iw - cw) * offsetX;
  const cy = (ih - ch) * offsetY;
  
  ctx.drawImage(img, cx, cy, cw, ch, x, y, w, h);
}

function drawFrame(index) {
  const img = images[index];
  if (img && img.complete) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawImageProp(ctx, img, 0, 0, canvas.width, canvas.height);
  }
}

// Ajustar dimensiones del canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const currentFrame = Math.floor(frameSequence.frame);
  drawFrame(currentFrame);
}

window.addEventListener('resize', resizeCanvas);
// Ejecutar una vez al inicio
resizeCanvas();

// ============================================
// ANIMACIONES CON GSAP & SCROLLTRIGGER
// ============================================

// 1. Animación de la secuencia de frames
gsap.to(frameSequence, {
  frame: frameCount - 1,
  snap: "frame",
  ease: "none",
  scrollTrigger: {
    trigger: "#scrollytelling",
    start: "top top",
    end: "bottom bottom",
    scrub: 0.5 // Agrega inercia suave al movimiento
  },
  onUpdate: () => {
    drawFrame(Math.floor(frameSequence.frame));
  }
});

// 2. Control de visibilidad de los paneles de texto
const tl = gsap.timeline({
  scrollTrigger: {
    trigger: "#scrollytelling",
    start: "top top",
    end: "bottom bottom",
    scrub: true
  }
});

// Panel 0: Hero
// Ya está visible por defecto, lo desvanecemos del 15% al 22% del scroll
tl.to('#panelHero', { 
  opacity: 0, 
  y: -50, 
  autoAlpha: 0, 
  ease: 'power1.inOut', 
  duration: 0.07 
}, 0.15);

// Panel 1: Moldear
// Aparece del 25% al 30%, desaparece del 42% al 47%
tl.fromTo('#panelMoldear', 
  { opacity: 0, y: 50, autoAlpha: 0 }, 
  { opacity: 1, y: 0, autoAlpha: 1, ease: 'power1.inOut', duration: 0.05 }, 
  0.25
);
tl.to('#panelMoldear', { 
  opacity: 0, 
  y: -50, 
  autoAlpha: 0, 
  ease: 'power1.inOut', 
  duration: 0.05 
}, 0.42);

// Panel 2: Secar
// Aparece del 48% al 53%, desaparece del 65% al 70%
tl.fromTo('#panelSecar', 
  { opacity: 0, y: 50, autoAlpha: 0 }, 
  { opacity: 1, y: 0, autoAlpha: 1, ease: 'power1.inOut', duration: 0.05 }, 
  0.48
);
tl.to('#panelSecar', { 
  opacity: 0, 
  y: -50, 
  autoAlpha: 0, 
  ease: 'power1.inOut', 
  duration: 0.05 
}, 0.65);

// Panel 3: Esmaltado
// Aparece del 70% al 75%, desaparece del 88% al 93%
tl.fromTo('#panelEsmaltado', 
  { opacity: 0, y: 50, autoAlpha: 0 }, 
  { opacity: 1, y: 0, autoAlpha: 1, ease: 'power1.inOut', duration: 0.05 }, 
  0.70
);
tl.to('#panelEsmaltado', { 
  opacity: 0, 
  y: -50, 
  autoAlpha: 0, 
  ease: 'power1.inOut', 
  duration: 0.05 
}, 0.88);


// ============================================
// CARRUSEL CINEMATOGRÁFICO HORIZONTAL
// ============================================

(function initCollectionCarousel() {
  const isMobile = () => window.innerWidth <= 768;

  const track       = document.getElementById('collectionCarouselTrack');
  const cards       = Array.from(document.querySelectorAll('.collection-card'));
  const numEl       = document.getElementById('active-card-num');
  const progressBar = document.getElementById('collection-progressbar-fill');
  const cardNameEl  = document.getElementById('collection-card-name');

  if (!track || cards.length === 0) return;

  const CARD_NAMES = cards.map(c => c.dataset.name);
  const CARD_COUNT = cards.length;

  // ---- Estado inicial de profundidad de campo ----
  // La primera tarjeta empieza como "activa" (en el centro).
  // El resto empieza atenuado y borroso.
  gsap.set(cards[0], { scale: 1.05, opacity: 1, filter: 'blur(0px)' });
  cards.slice(1).forEach(c => {
    gsap.set(c, { scale: 0.82, opacity: 0.35, filter: 'blur(5px)' });
  });

  let scrollTriggerInstance = null;

  function buildCarousel() {
    if (isMobile()) {
      // En mobile limpiamos cualquier instancia y no hacemos nada más
      if (scrollTriggerInstance) {
        scrollTriggerInstance.kill();
        scrollTriggerInstance = null;
      }
      gsap.set(track, { x: 0 });
      cards.forEach(c => gsap.set(c, { scale: 1, opacity: 1, filter: 'blur(0px)' }));
      return;
    }

    // --- Cálculo de posiciones de centrado ---
    // El centro de la zona de carrusel (excluyendo el sidebar)
    const container     = document.querySelector('.collection-carousel-container');
    const containerRect = container.getBoundingClientRect();
    const containerCenterX = containerRect.left + containerRect.width / 2;

    // Para cada tarjeta: cuánto hay que mover el track en X para que esa tarjeta quede centrada
    const cardOffsets = cards.map(card => {
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      // Offset actual del track (si ya tiene transform, lo sumamos)
      const currentX = gsap.getProperty(track, 'x') || 0;
      return containerCenterX - cardCenterX + Number(currentX);
    });

    // Recalcular sin transform activo
    gsap.set(track, { x: 0 });
    const freshOffsets = cards.map(card => {
      const rect = card.getBoundingClientRect();
      const cardCenterX = rect.left + rect.width / 2;
      return containerCenterX - cardCenterX;
    });

    const firstX = freshOffsets[0];  // posición inicial (tarjeta 1 centrada)
    const lastX  = freshOffsets[CARD_COUNT - 1];  // posición final (última tarjeta centrada)

    // Mover el track al estado inicial
    gsap.set(track, { x: firstX });

    // Limpiar instancia anterior si existe
    if (scrollTriggerInstance) {
      scrollTriggerInstance.kill();
    }

    // --- ScrollTrigger principal del carrusel ---
    scrollTriggerInstance = ScrollTrigger.create({
      trigger:  '#coleccion',
      start:    'top top',
      end:      'bottom bottom',
      pin:      '.collection-sticky-container',
      pinSpacing: false,
      scrub:    1.2,
      onUpdate: (self) => {
        const progress = self.progress; // 0 → 1

        // Posición X del track: interpola desde firstX hasta lastX
        const currentX = gsap.utils.interpolate(firstX, lastX, progress);
        gsap.set(track, { x: currentX });

        // ── Profundidad de campo continua ──
        const containerRectNow = container.getBoundingClientRect();
        const centerNow        = containerRectNow.left + containerRectNow.width / 2;

        let closestDist = Infinity;
        let closestIdx  = 0;

        cards.forEach((card, i) => {
          const rect      = card.getBoundingClientRect();
          const cardCX    = rect.left + rect.width / 2;
          const dist      = Math.abs(cardCX - centerNow);
          const maxDist   = containerRectNow.width * 0.7; // radio de influencia
          const t         = Math.min(dist / maxDist, 1);  // 0 = centro, 1 = lejos

          const scale   = gsap.utils.interpolate(1.05, 0.82, t);
          const opacity = gsap.utils.interpolate(1,    0.32,  t);
          const blur    = gsap.utils.interpolate(0,    6,     t);

          gsap.set(card, {
            scale,
            opacity,
            filter: `blur(${blur}px)`,
          });

          if (dist < closestDist) {
            closestDist = dist;
            closestIdx  = i;
          }
        });

        // ── Contador y barra de progreso ──
        const cardNum = String(closestIdx + 1).padStart(2, '0');
        if (numEl && numEl.textContent !== cardNum) {
          numEl.textContent = cardNum;
        }
        if (cardNameEl && cardNameEl.textContent !== CARD_NAMES[closestIdx]) {
          cardNameEl.textContent = CARD_NAMES[closestIdx];
        }
        if (progressBar) {
          // Barra va del 25% (1/4) al 100% (4/4) de manera continua
          const barWidth = ((closestIdx + 1) / CARD_COUNT) * 100;
          progressBar.style.width = barWidth + '%';
        }
      }
    });
  }

  // Construir al cargar
  // Esperar un microtask para que el DOM esté pintado y los getBoundingClientRect() sean correctos
  requestAnimationFrame(() => {
    requestAnimationFrame(buildCarousel);
  });

  // Reconstruir en resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      ScrollTrigger.refresh();
      buildCarousel();
    }, 200);
  });
})();

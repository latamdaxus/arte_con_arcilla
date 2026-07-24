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

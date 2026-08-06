// Registrar ScrollTrigger con GSAP
gsap.registerPlugin(ScrollTrigger);

const canvas = document.getElementById('scrollCanvas');
const ctx = canvas.getContext('2d');

// El barrido con scroll va de p_001 a p_192: p_192 es la toma con el plato
// sobre la mesa, y es contra ella que está calibrado el despegue del sprite.
// p_193 es la misma escena con la mesa vacía y queda FUERA del barrido: se
// muestra recién en el instante del despegue (ver "mesa vacía" más abajo), para
// que el plato parezca levantarse. Mide 1672x941 en vez de 1280x720, pero
// conserva la proporción, así que se dibuja por el mismo camino.
const frameCount = 192;
const EMPTY_TABLE_INDEX = frameCount; // p_193
const TOTAL_FRAMES = frameCount + 1;
const images = [];
const frameSequence = { frame: 0 };

// Cuando es true el fondo reposa en p_193 (mesa vacía) en vez de seguir el
// barrido. Lo conmuta el ScrollTrigger del despegue, en ambos sentidos.
let tableEmpty = false;

// --- Geometría compartida de la escena ---
// Todo lo que tenga que calzar con el fondo se expresa en "coordenadas de
// frame" (el sistema de 1280x720 de los WebP) y se proyecta a pantalla con
// fitFrame(). Así el fondo y los sprites usan exactamente la misma
// transformación y calzan en cualquier viewport.
const FRAME_W = 1280;
const FRAME_H = 720;

// Dónde cae el canvas completo del sprite (720x720) dentro del frame, y qué
// parte de ese cuadrado ocupa el plato pintado. Calibrado por correlación
// cruzada de v_001 contra p_192 (escala 0.875).
const SPRITE_IN_FRAME = { x: 345.88, y: 54.25, size: 630 };
const PLATE_IN_FRAME = { x: 408, y: 112, w: 520, h: 508 };

// Escala tipo "cover", pero nunca tanto como para recortar el plato. En una
// pantalla vertical el cover puro se comería medio plato (y el sprite no
// tendría contra qué calzar), así que ahí se limita la escala y quedan bandas
// del color de la sección. Nunca deforma: la proporción del frame se respeta
// siempre, que es lo que producía el óvalo aplastado en celular.
function fitFrame(vw, vh) {
  const cover = Math.max(vw / FRAME_W, vh / FRAME_H);
  const contain = Math.min(vw / FRAME_W, vh / FRAME_H);

  // Semiejes del plato medidos desde el centro del frame (el recorte del cover
  // es centrado), con un poco de aire alrededor.
  const AIR = 1.04;
  const halfW = Math.max(Math.abs(PLATE_IN_FRAME.x - FRAME_W / 2),
    Math.abs(PLATE_IN_FRAME.x + PLATE_IN_FRAME.w - FRAME_W / 2)) * AIR;
  const halfH = Math.max(Math.abs(PLATE_IN_FRAME.y - FRAME_H / 2),
    Math.abs(PLATE_IN_FRAME.y + PLATE_IN_FRAME.h - FRAME_H / 2)) * AIR;
  const keepPlate = Math.min(vw / (2 * halfW), vh / (2 * halfH));

  const scale = Math.min(cover, Math.max(contain, keepPlate));
  const dw = FRAME_W * scale;
  const dh = FRAME_H * scale;
  return { scale, dw, dh, dx: (vw - dw) / 2, dy: (vh - dh) / 2 };
}

// Proyecta un rectángulo en coordenadas de frame a coordenadas de pantalla.
function frameRectToScreen(rect) {
  const f = fitFrame(window.innerWidth, window.innerHeight);
  const size = (rect.size !== undefined ? rect.size : rect.w) * f.scale;
  return {
    centerX: f.dx + (rect.x + (rect.size !== undefined ? rect.size : rect.w) / 2) * f.scale,
    centerY: f.dy + (rect.y + (rect.size !== undefined ? rect.size : rect.h) / 2) * f.scale,
    size
  };
}

const pad = (num, size) => ('000' + num).slice(-size);

// Descarga en orden y con concurrencia limitada. Pedir los 193 frames a la vez
// agota el límite de conexiones por host de HTTP/1.1 (6), dejando en cola
// indefinidamente cualquier imagen posterior — incluidas las secuencias de los
// puentes animados, que se quedaban sin dibujar.
(function loadPrincipalFrames() {
  const CONCURRENCY = 6;
  let next = 0;

  const startOne = () => {
    if (next >= TOTAL_FRAMES) return;
    const i = next++;
    const img = new Image();
    images[i] = img;
    const onSettled = () => {
      if (sceneFrameIndex() === i) drawFrame(i);
      startOne();
    };
    img.onload = onSettled;
    img.onerror = onSettled;
    img.src = `assets/fames/principal-frames/p_${pad(i + 1, 3)}.webp`;
  };

  for (let k = 0; k < CONCURRENCY; k++) startOne();
})();

function drawFrame(index) {
  const img = images[index];
  // Si el frame todavía no llegó no se dibuja nada: queda en pantalla el
  // anterior, que es una degradación mejor que un canvas en blanco. El cargador
  // vuelve a pedir el dibujo en cuanto la imagen termina de descargar.
  if (!img || !img.complete || !img.naturalWidth) return;
  const f = fitFrame(canvas.width, canvas.height);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // El frame se dibuja completo y proporcional; lo que se salga del canvas lo
  // recorta el propio canvas.
  ctx.drawImage(img, f.dx, f.dy, f.dw, f.dh);
}

// Qué frame le toca al fondo ahora mismo.
function sceneFrameIndex() {
  return tableEmpty ? EMPTY_TABLE_INDEX : Math.floor(frameSequence.frame);
}

function renderScene() {
  drawFrame(sceneFrameIndex());
}

// Ajustar dimensiones del canvas
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  renderScene();
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
  onUpdate: renderScene
});

// 1b. Mesa vacía: el fondo sostiene p_192 durante todo el barrido y recién pasa
// a p_193 en el instante del despegue del sprite —el mismo punto donde arranca
// el vuelo de Van Gogh, "bottom bottom" de #scrollytelling—, de modo que el
// plato parezca levantarse de la mesa. Si no se atara a ese punto, la mesa se
// vaciaría casi una pantalla antes y quedaría un tramo con la mesa vacía y nada
// volando. Al scrollear hacia arriba vuelve a p_192.
ScrollTrigger.create({
  trigger: '#scrollytelling',
  start: 'bottom bottom',
  end: 'bottom top', // mientras el taller sigue a la vista
  onEnter: () => setTableEmpty(true),
  onEnterBack: () => setTableEmpty(true),
  onLeaveBack: () => setTableEmpty(false),
  // Deja el estado correcto si la página carga (o se redimensiona) ya pasada
  // la marca, cuando onEnter no llega a dispararse.
  onRefresh: (self) => setTableEmpty(window.scrollY >= self.start)
});

function setTableEmpty(value) {
  if (tableEmpty === value) return;
  tableEmpty = value;
  renderScene();
}

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


// ============================================
// PUENTES ANIMADOS: VAN GOGH Y TOTORO
// ============================================
// Dos secuencias de sprites (canvas, fondo transparente) que sirven de
// transición entre secciones: Van Gogh cierra el "scrollytelling" y
// aterriza sobre la primera tarjeta de la colección; Totoro despega de
// la última tarjeta de la colección y aterriza en el bloque de contacto.
(function initFrameBridges() {
  const isMobile = () => window.innerWidth <= 768;

  const BASE = 640; // resolución base (px) de los canvas, cuadrados
  const pad = (n) => ('000' + n).slice(-3);

  function setupCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = BASE * dpr;
    canvas.height = BASE * dpr;
    canvas.style.width = BASE + 'px';
    canvas.style.height = BASE + 'px';
    gsap.set(canvas, { xPercent: -50, yPercent: -50, transformOrigin: 'center center', autoAlpha: 0 });
  }

  // Secuencia de sprites con redibujado diferido: si el frame pedido aún no
  // ha terminado de descargar, se vuelve a dibujar en cuanto cargue. Sin esto
  // el canvas queda en blanco al entrar por primera vez, porque el scroll ya
  // dejó de emitir eventos cuando las imágenes acabaron de llegar.
  function createSequence(canvas, path, prefix, count) {
    const ctx = canvas.getContext('2d');
    const images = [];
    let currentIndex = 0;
    let drawnIndex = -1;
    let loaded = false;

    const isReady = (i) => {
      const img = images[i];
      return !!img && img.complete && img.naturalWidth > 0;
    };

    // Si el frame exacto aún no llegó, usa el más cercano ya descargado: así la
    // animación se degrada (va "a saltos") en vez de dejar el canvas en blanco.
    function pickDrawable(index) {
      if (isReady(index)) return index;
      for (let d = 1; d < count; d++) {
        if (index - d >= 0 && isReady(index - d)) return index - d;
        if (index + d < count && isReady(index + d)) return index + d;
      }
      return -1;
    }

    function paint(index) {
      const i = pickDrawable(index);
      if (i < 0) return;
      drawnIndex = i;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(images[i], 0, 0, canvas.width, canvas.height);
    }

    return {
      // Descarga en orden con concurrencia limitada: pedir los ~192 frames de
      // golpe saturaba la conexión y los servidores los rechazaban
      // (ERR_CONNECTION_RESET), dejando el canvas vacío.
      load() {
        if (loaded) return;
        loaded = true;
        const CONCURRENCY = 6;
        let next = 0;

        const startOne = () => {
          if (next >= count) return;
          const i = next++;
          const img = new Image();
          images[i] = img;
          const onSettled = () => {
            // Redibuja si este frame recién llegado se acerca más al objetivo
            // que el que está actualmente en pantalla.
            const better = drawnIndex < 0 ||
              Math.abs(i - currentIndex) < Math.abs(drawnIndex - currentIndex);
            if (better) paint(currentIndex);
            startOne();
          };
          img.onload = onSettled;
          img.onerror = onSettled;
          img.src = `${path}/${prefix}_${pad(i + 1)}.webp`;
        };

        for (let k = 0; k < CONCURRENCY; k++) startOne();
      },
      draw(index) {
        currentIndex = index;
        paint(index);
      }
    };
  }

  // Posición en pantalla que tendrá un elemento de flujo normal cuando el
  // scroll llegue a scrollY. Se usa en celular, donde la colección y el
  // contacto no van "pinneados" y por tanto sí se desplazan con la página.
  function screenRectAtScroll(el, scrollY) {
    const r = el.getBoundingClientRect();
    return {
      width: r.width,
      height: r.height,
      centerX: r.left + r.width / 2,
      centerY: r.top + window.scrollY + r.height / 2 - scrollY
    };
  }

  function cardBox() {
    const card = document.querySelector('.collection-card .collection-card-image');
    if (!card) return null;
    const cs = getComputedStyle(card);
    return { el: card, width: parseFloat(cs.width), height: parseFloat(cs.height) };
  }

  // Rect de la tarjeta del carrusel donde aterriza/despega un sprite.
  // En desktop el contenedor va "pinneado" y la tarjeta activa queda centrada
  // en pantalla, así que el centro es fijo. En celular es una tira horizontal
  // normal, así que hay que proyectar dónde estará en el scroll indicado.
  function collectionCardRect(scrollY) {
    const container = document.querySelector('.collection-carousel-container');
    const box = cardBox();
    if (!container || !box) return null;

    if (isMobile()) {
      const r = screenRectAtScroll(box.el, scrollY);
      return { width: box.width, height: box.height, centerX: r.centerX, centerY: r.centerY };
    }
    const cr = container.getBoundingClientRect();
    return {
      width: box.width,
      height: box.height,
      centerX: cr.left + cr.width / 2,
      centerY: window.innerHeight / 2
    };
  }

  // ---- VAN GOGH: del cierre del scrollytelling a la 1ª tarjeta ----
  (function initVanGoghBridge() {
    const bridge = document.getElementById('vanGoghBridge');
    const canvas = document.getElementById('vanGoghCanvas');
    if (!bridge || !canvas) return;

    const FRAME_COUNT = 192;
    setupCanvas(canvas);
    const seq = createSequence(canvas, 'assets/fames/van-gogh-frames_sin_fondo', 'v', FRAME_COUNT);

    // Precarga anticipada, cerca del final de la secuencia principal
    ScrollTrigger.create({ trigger: '#scrollytelling', start: '35% top', once: true, onEnter: () => seq.load() });

    let trigger = null;

    function build() {
      gsap.set(canvas, { autoAlpha: 0 });
      if (trigger) trigger.kill();

      const mob = isMobile();

      trigger = ScrollTrigger.create({
        // Arranca cuando la secuencia principal ya llegó a su último frame (y el
        // paso "Esmaltado" se desvaneció). En desktop termina justo cuando
        // arranca la colección (la tarjeta ya está centrada por el pin); en
        // celular, cuando la primera tarjeta queda centrada en pantalla.
        trigger: '#scrollytelling',
        start: 'bottom bottom',
        endTrigger: mob ? '.collection-card .collection-card-image' : '#coleccion',
        end: mob ? 'center center' : 'top top',
        scrub: 1,
        onUpdate: (self) => {
          seq.load();
          const p = self.progress;

          const target = collectionCardRect(self.end);
          if (!target) return;

          // Punto de partida: el sprite calcado sobre el plato del fondo. Se
          // deriva de la misma proyección que usa el canvas del taller, así que
          // coincide en cualquier viewport sin recalibrar.
          const from = frameRectToScreen(SPRITE_IN_FRAME);
          const fromScale = from.size / BASE;
          const toScale = Math.min(target.width, target.height) * 0.85 / BASE;

          let x, y, scale;
          if (p < 0.22) {
            // Fase 1: despega creciendo un poco, sin moverse del plato.
            const t = gsap.parseEase('power1.out')(p / 0.22);
            scale = gsap.utils.interpolate(fromScale, fromScale * 1.18, t);
            x = from.centerX;
            y = gsap.utils.interpolate(from.centerY, from.centerY - from.size * 0.04, t);
          } else {
            // Fase 2: viaja y se ajusta al tamaño de la tarjeta.
            const t = gsap.parseEase('power2.inOut')((p - 0.22) / 0.78);
            scale = gsap.utils.interpolate(fromScale * 1.18, toScale, t);
            x = gsap.utils.interpolate(from.centerX, target.centerX, t);
            y = gsap.utils.interpolate(from.centerY - from.size * 0.04, target.centerY, t);
          }

          // Opaco desde el primer instante: como arranca calcado sobre el plato,
          // el relevo es invisible y se lee como continuidad.
          const opacity = p >= 0.995 ? 0 : 1;

          gsap.set(canvas, { x, y, scale, autoAlpha: opacity });
          seq.draw(Math.min(FRAME_COUNT - 1, Math.floor(p * FRAME_COUNT)));
        },
        onLeaveBack: () => gsap.set(canvas, { autoAlpha: 0 })
      });
    }

    requestAnimationFrame(() => requestAnimationFrame(build));

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
        build();
      }, 200);
    });
  })();

  // ---- TOTORO: del cierre del carrusel de colección al bloque de contacto ----
  (function initTotoroBridge() {
    const bridge = document.getElementById('totoroBridge');
    const canvas = document.getElementById('totoroCanvas');
    const visual = document.getElementById('contactVisual');
    if (!bridge || !canvas || !visual) return;

    const FRAME_COUNT = 192;
    setupCanvas(canvas);
    const seq = createSequence(canvas, 'assets/fames/totoro-frames_sin_fondo', 't', FRAME_COUNT);

    // Precarga anticipada, cerca del final del recorrido horizontal
    ScrollTrigger.create({ trigger: '#vanGoghBridge', start: 'top top', once: true, onEnter: () => seq.load() });

    // Fija el tamaño del slot visual de contacto (tarjeta +30%) y devuelve su
    // rect. En desktop el contenido va centrado en un contenedor sticky de
    // 100vh, así que el centro vertical es media pantalla; en celular el bloque
    // es de flujo normal y hay que proyectarlo al scroll de llegada.
    function sizeAndGetVisualRect(cardRect, scrollY) {
      const cardBase = Math.min(cardRect.width, cardRect.height);
      const finalSize = Math.min(cardBase * 1.3, window.innerWidth * 0.44, window.innerHeight * 0.78);
      visual.style.width = finalSize + 'px';
      visual.style.height = finalSize + 'px';

      if (isMobile()) {
        const r = screenRectAtScroll(visual, scrollY);
        return { width: finalSize, height: finalSize, centerX: r.centerX, centerY: r.centerY };
      }
      const rect = visual.getBoundingClientRect();
      return {
        width: finalSize,
        height: finalSize,
        centerX: rect.left + finalSize / 2,
        centerY: window.innerHeight / 2
      };
    }

    let trigger = null;

    function build() {
      gsap.set(canvas, { autoAlpha: 0 });
      if (trigger) trigger.kill();

      const mob = isMobile();

      trigger = ScrollTrigger.create({
        // Desktop: arranca cuando el recorrido horizontal ya terminó (última
        // tarjeta centrada). Celular: no hay recorrido horizontal, así que
        // despega en el mismo punto donde Van Gogh aterriza —la tarjeta
        // centrada—, evitando que ambos sprites se pisen. Acaba cuando la
        // sección de contacto queda en su sitio.
        trigger: mob ? '.collection-card .collection-card-image' : '#coleccion',
        start: mob ? 'center center' : 'bottom bottom',
        endTrigger: '#contacto',
        end: 'top top',
        scrub: 1,
        onUpdate: (self) => {
          seq.load();
          const p = self.progress;
          const eased = gsap.parseEase('power1.inOut')(p);

          const from = collectionCardRect(self.start);
          if (!from) return;
          const to = sizeAndGetVisualRect(from, self.end);
          const fromScale = Math.min(from.width, from.height) / BASE;
          const toScale = Math.min(to.width, to.height) / BASE;

          const x = gsap.utils.interpolate(from.centerX, to.centerX, eased);
          const y = gsap.utils.interpolate(from.centerY, to.centerY, eased);
          const scale = gsap.utils.interpolate(fromScale, toScale, eased);
          const opacity = p >= 0.995 ? 0 : 1; // revela la imagen estática de contacto

          gsap.set(canvas, { x, y, scale, autoAlpha: opacity });
          seq.draw(Math.min(FRAME_COUNT - 1, Math.floor(p * FRAME_COUNT)));
        },
        onLeaveBack: () => gsap.set(canvas, { autoAlpha: 0 })
      });
    }

    requestAnimationFrame(() => requestAnimationFrame(build));

    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
        build();
      }, 200);
    });
  })();
})();

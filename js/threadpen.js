// ==========================
// config
// ==========================
const CONFIG = {
  spacing: 94,
  arcHeight: 6.0,
  stitchVisibleRatio: 0.55,
  maxStitches: 40,
  fadeDuration: 900,
  strokeWidth: 0.5,

  // appearance
  threadColor: "#cf6a6a",
  startOpacity: 0.3,

  // arc behavior
  arcMode: "alternate", // "alternate" | "fixed"
  arcSide: 1,           // 1 or -1 when arcMode === "fixed"

  // shape tuning
  curveInsetRatio: 0.28 // higher = flatter / rounder arch
};

// ==========================
// state
// ==========================
const state = {
  mouse: {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    active: false
  },
  sampledPoints: [],
  stitches: [],
  stitchIndex: 0
};

// ==========================
// setup
// ==========================
const svg = document.querySelector(".thread-svg");
const threadLayer = document.getElementById("thread-layer");

// ==========================
// helpers
// ==========================
function resizeStage() {
  svg.setAttribute("viewBox", `0 0 ${window.innerWidth} ${window.innerHeight}`);
}

function distanceBetween(a, b) {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getArcDirection() {
  if (CONFIG.arcMode === "fixed") {
    return CONFIG.arcSide >= 0 ? 1 : -1;
  }

  return state.stitchIndex % 2 === 0 ? 1 : -1;
}

// ==========================
// mouse input
// ==========================
function handleMouseMove(event) {
  state.mouse.x = event.clientX;
  state.mouse.y = event.clientY;
  state.mouse.active = true;
}

// ==========================
// point sampling
// ==========================
function sampleMousePoint(now) {
  const points = state.sampledPoints;
  const { x, y, active } = state.mouse;

  if (!active) return;

  const currentPoint = { x, y, time: now };
  const last = points[points.length - 1];

  if (!last) {
    points.push(currentPoint);
    return;
  }

  const dist = distanceBetween(last, currentPoint);

  if (dist >= CONFIG.spacing) {
    points.push(currentPoint);
    createStitchFromLastTwoPoints(now);

    if (points.length > CONFIG.maxStitches + 2) {
      points.shift();
    }
  }
}

// ==========================
// stitch creation
// ==========================
function createStitchFromLastTwoPoints(now) {
  const points = state.sampledPoints;
  if (points.length < 2) return;

  const a = points[points.length - 2];
  const b = points[points.length - 1];

  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) return;

  const nx = dx / length;
  const ny = dy / length;

  const px = -ny;
  const py = nx;

  const visibleRatio = clamp(CONFIG.stitchVisibleRatio ?? 0.55, 0.1, 1);
  const hiddenAmount = (1 - visibleRatio) * 0.5 * length;

  const startX = a.x + nx * hiddenAmount;
  const startY = a.y + ny * hiddenAmount;

  const endX = b.x - nx * hiddenAmount;
  const endY = b.y - ny * hiddenAmount;

  const visibleDx = endX - startX;
  const visibleDy = endY - startY;
  const visibleLength = Math.hypot(visibleDx, visibleDy);

  if (visibleLength <= 0.0001) return;

  const direction = getArcDirection();

  const insetRatio = clamp(CONFIG.curveInsetRatio ?? 0.28, 0.12, 0.45);
  const c1BaseX = startX + visibleDx * insetRatio;
  const c1BaseY = startY + visibleDy * insetRatio;

  const c2BaseX = endX - visibleDx * insetRatio;
  const c2BaseY = endY - visibleDy * insetRatio;

  const archHeight = CONFIG.arcHeight * direction;

  const c1x = c1BaseX + px * archHeight;
  const c1y = c1BaseY + py * archHeight;

  const c2x = c2BaseX + px * archHeight;
  const c2y = c2BaseY + py * archHeight;

  const d = `M ${startX} ${startY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${endX} ${endY}`;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", d);
  path.setAttribute("class", "thread-stitch");
  path.style.stroke = CONFIG.threadColor;
  path.style.opacity = `${clamp(CONFIG.startOpacity, 0, 1)}`;
  path.style.strokeWidth = `${CONFIG.strokeWidth}`;

  threadLayer.appendChild(path);

  state.stitches.push({
    el: path,
    createdAt: now
  });

  state.stitchIndex += 1;
}

// ==========================
// stitch aging / cleanup
// ==========================
function updateStitches(now) {
  state.stitches = state.stitches.filter((stitch) => {
    const age = now - stitch.createdAt;
    const life = 1 - age / CONFIG.fadeDuration;

    if (life <= 0) {
      stitch.el.remove();
      return false;
    }

    const opacity = clamp(CONFIG.startOpacity, 0, 1) * life;
    stitch.el.style.opacity = opacity.toFixed(3);
    return true;
  });

  while (state.stitches.length > CONFIG.maxStitches) {
    const oldest = state.stitches.shift();
    if (oldest?.el) {
      oldest.el.remove();
    }
  }
}

// ==========================
// animation loop
// ==========================
function tick(now) {
  sampleMousePoint(now);
  updateStitches(now);
  requestAnimationFrame(tick);
}

// ==========================
// init
// ==========================
function init() {
  if (!svg || !threadLayer) {
    console.error("Missing .thread-svg or #thread-layer in the DOM.");
    return;
  }

  resizeStage();

  window.addEventListener("resize", resizeStage);
  window.addEventListener("mousemove", handleMouseMove);

  requestAnimationFrame(tick);
}

init();
const gallery = document.getElementById("gallery");

const layers = {
  back: document.querySelector(".gallery-back"),
  mid: document.querySelector(".gallery-mid"),
  front: document.querySelector(".gallery-front"),
};

const CONFIG = {
  maxActive: {
    back: 8,
    mid: 3,
    front: 2,
  },

  initialSpawnDelay: {
    min: 600,
    max: 1600,
  },

  globalSpawnDelay: {
    min: 100,
    max: 200,
  },

  speeds: {
    back: 0.2,
    mid: 0.4,
    front: 0.7,
  },

  speedVariance: 0.18,

  spawnPadding: {
    left: 28,
    right: 28,
  },

  spawnY: {
    min: -720,
    max: -260,
  },

  widths: {
    back: { min: 130, max: 180 },
    mid: { min: 170, max: 225 },
    front: { min: 210, max: 270 },
  },

  scales: {
    back: { min: 0.72, max: 0.82 },
    mid: { min: 0.88, max: 1.0 },
    front: { min: 1.02, max: 1.14 },
  },

  aspectRatio: {
    min: 1.2,
    max: 1.45,
  },

  tilt: {
    yMin: 5,
    yMax: 10,
    zMin: -3.2,
    zMax: 3.2,
    wobbleAmount: 1.1,
    wobbleSpeedMin: 0.0008,
    wobbleSpeedMax: 0.0016,
  },

  // Increased a bit to better accommodate the visual spread from tilt.
  minHorizontalGap: 150,
  minVerticalGapAtSpawn: 220,
  maxSpawnPositionTries: 60,

  drift: {
    amount: 10,
    speedMin: 0.00035,
    speedMax: 0.00075,
  },

  // New: push layers backward/forward in 3D space.
  depth: {
    back: { min: -240, max: -140 },
    mid: { min: -100, max: -30 },
    front: { min: 10, max: 60 },
  },

  // Extra space required based on tilt angle.
  tiltSpacingFactor: 4,

  removeOffset: 260,
};

const items = [];
let imageId = 1;
let spawnTimeoutId = null;

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function randomInt(max) {
  return Math.floor(Math.random() * max);
}

function randomSign() {
  return Math.random() < 0.5 ? -1 : 1;
}

function getRandomImage(id) {
  const width = 260 + Math.floor(Math.random() * 120);
  const height = 320 + Math.floor(Math.random() * 180);
  return `https://picsum.photos/${width}/${height}?random=${id}`;
}

function getRangeValue(range) {
  return randomBetween(range.min, range.max);
}

function getLayerDepth(layerName) {
  return randomBetween(
    CONFIG.depth[layerName].min,
    CONFIG.depth[layerName].max
  );
}

function getActiveCount(layerName) {
  return items.filter((item) => item.layerName === layerName).length;
}

function getAvailableLayers() {
  return Object.keys(layers).filter((layerName) => {
    return getActiveCount(layerName) < CONFIG.maxActive[layerName];
  });
}

function pickRandomAvailableLayer() {
  const available = getAvailableLayers();
  if (available.length === 0) return null;
  return available[randomInt(available.length)];
}

function getSpawnY() {
  return randomBetween(CONFIG.spawnY.min, CONFIG.spawnY.max);
}

function getVisibleWidth(itemWidth, scale) {
  return itemWidth * scale;
}

function getItemCenterXFromValues(x, width, scale) {
  return x + getVisibleWidth(width, scale) / 2;
}

function getTiltBuffer(tiltY) {
  return Math.abs(tiltY) * CONFIG.tiltSpacingFactor;
}

function isSpawnPositionValid(
  candidateX,
  candidateY,
  candidateWidth,
  candidateScale,
  candidateTiltY = 0
) {
  const candidateVisibleWidth = getVisibleWidth(candidateWidth, candidateScale);
  const candidateCenterX =
    getItemCenterXFromValues(candidateX, candidateWidth, candidateScale);
  const candidateTiltBuffer = getTiltBuffer(candidateTiltY);

  for (const item of items) {
    const itemVisibleWidth = getVisibleWidth(item.width, item.scale);
    const itemCenterX = getItemCenterXFromValues(item.x, item.width, item.scale);

    const horizontalDistance = Math.abs(candidateCenterX - itemCenterX);
    const verticalDistance = Math.abs(candidateY - item.y);
    const itemTiltBuffer = getTiltBuffer(item.baseTiltY || 0);

    const requiredHorizontalGap =
      (candidateVisibleWidth + itemVisibleWidth) / 2 +
      CONFIG.minHorizontalGap +
      candidateTiltBuffer +
      itemTiltBuffer;

    if (
      horizontalDistance < requiredHorizontalGap &&
      verticalDistance < CONFIG.minVerticalGapAtSpawn
    ) {
      return false;
    }
  }

  return true;
}

function getSpawnPosition(itemWidth, scale, tiltY = 0) {
  const galleryWidth = gallery.clientWidth;
  const visibleWidth = getVisibleWidth(itemWidth, scale);

  const minX = CONFIG.spawnPadding.left;
  const maxX = galleryWidth - CONFIG.spawnPadding.right - visibleWidth;

  const safeMaxX = Math.max(minX, maxX);

  for (let i = 0; i < CONFIG.maxSpawnPositionTries; i++) {
    const x = randomBetween(minX, safeMaxX);
    const y = getSpawnY();

    if (isSpawnPositionValid(x, y, itemWidth, scale, tiltY)) {
      return { x, y };
    }
  }

  return {
    x: randomBetween(minX, safeMaxX),
    y: getSpawnY(),
  };
}

function buildTransform(item, time) {
  const tiltWobble =
    Math.sin(time * item.wobbleSpeed + item.wobbleOffset) *
    CONFIG.tilt.wobbleAmount;

  const currentTiltY = item.baseTiltY + tiltWobble;

  const horizontalDrift =
    Math.sin(time * item.driftSpeed + item.driftOffset) * item.driftAmount;

  return `
    translate3d(${horizontalDrift}px, ${item.y}px, ${item.depth}px)
    scale(${item.scale})
    rotateY(${currentTiltY}deg)
    rotateZ(${item.baseTiltZ}deg)
  `;
}

function applyItemStyles(item, time = performance.now()) {
  item.el.style.width = `${item.width}px`;
  item.el.style.height = `${item.height}px`;
  item.el.style.left = `${item.x}px`;
  item.el.style.transform = buildTransform(item, time);
}

function createItem(layerName) {
  const el = document.createElement("div");
  el.classList.add("gallery-item");

  const img = document.createElement("img");
  img.src = getRandomImage(imageId++);
  img.alt = "";

  el.appendChild(img);

  const width = getRangeValue(CONFIG.widths[layerName]);
  const aspectRatio = getRangeValue(CONFIG.aspectRatio);
  const height = width * aspectRatio;
  const scale = getRangeValue(CONFIG.scales[layerName]);

  // Calculate tilt before spawn position so spacing can account for it.
  const baseTiltY =
    randomBetween(CONFIG.tilt.yMin, CONFIG.tilt.yMax) * randomSign();

  const baseTiltZ = randomBetween(CONFIG.tilt.zMin, CONFIG.tilt.zMax);
  const position = getSpawnPosition(width, scale, baseTiltY);
  const speed = CONFIG.speeds[layerName] + Math.random() * CONFIG.speedVariance;
  const depth = getLayerDepth(layerName);

  const wobbleSpeed = randomBetween(
    CONFIG.tilt.wobbleSpeedMin,
    CONFIG.tilt.wobbleSpeedMax
  );

  const wobbleOffset = Math.random() * Math.PI * 2;

  const driftAmount = randomBetween(3, CONFIG.drift.amount);
  const driftSpeed = randomBetween(
    CONFIG.drift.speedMin,
    CONFIG.drift.speedMax
  );
  const driftOffset = Math.random() * Math.PI * 2;

  const item = {
    el,
    layerName,
    width,
    height,
    scale,
    x: position.x,
    y: position.y,
    speed,
    depth,
    baseTiltY,
    baseTiltZ,
    wobbleSpeed,
    wobbleOffset,
    driftAmount,
    driftSpeed,
    driftOffset,
  };

  applyItemStyles(item);
  layers[layerName].appendChild(el);
  items.push(item);
}

function removeItem(item) {
  item.el.remove();
  const index = items.indexOf(item);
  if (index !== -1) {
    items.splice(index, 1);
  }
}

function trySpawnOne() {
  const layerName = pickRandomAvailableLayer();
  if (!layerName) return;

  createItem(layerName);
}

function scheduleNextSpawn() {
  const delay = randomBetween(
    CONFIG.globalSpawnDelay.min,
    CONFIG.globalSpawnDelay.max
  );

  spawnTimeoutId = setTimeout(() => {
    trySpawnOne();
    scheduleNextSpawn();
  }, delay);
}

function animate(time = performance.now()) {
  const height = gallery.offsetHeight;

  for (let i = items.length - 1; i >= 0; i--) {
    const item = items[i];
    item.y += item.speed;

    if (item.y > height + CONFIG.removeOffset) {
      removeItem(item);
      continue;
    }

    item.el.style.transform = buildTransform(item, time);
  }

  requestAnimationFrame(animate);
}

function repositionItemsOnResize() {
  for (const item of items) {
    const position = getSpawnPosition(item.width, item.scale, item.baseTiltY);
    item.x = position.x;
    applyItemStyles(item);
  }
}

window.addEventListener("resize", repositionItemsOnResize);

function initGallery() {
  if (!gallery) return;

  const firstDelay = randomBetween(
    CONFIG.initialSpawnDelay.min,
    CONFIG.initialSpawnDelay.max
  );

  setTimeout(() => {
    trySpawnOne();
    scheduleNextSpawn();
  }, firstDelay);

  animate();
}

initGallery();
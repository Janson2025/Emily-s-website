import {
  randomBetween,
  getRangeValue,
  createImagePicker,
  getSpawnPosition,
  buildTransform,
  applyItemStyles,
  pickRandomAvailableLayer,
} from "./galleryUtils.js";

const gallery = document.getElementById("gallery");

const layers = {
  back: document.querySelector(".gallery-back"),
  mid: document.querySelector(".gallery-mid"),
  front: document.querySelector(".gallery-front"),
};
const CONFIG = {
  maxActive: {
    back: 7,
    mid: 3,
    front: 2,
  },

  // Spawn most of the initial items almost immediately
  // so the gallery does not start empty.
  initialSpawnDelay: {
    min: 0,
    max: 800,
  },

  // Spread later spawns out more so they feel regular
  // and reduce overlap spikes.
  globalSpawnDelay: {
    min: 1400,
    max: 2600,
  },

  speeds: {
    back: 0.18,
    mid: 0.3,
    front: 0.46,
  },

  speedVariance: 0.08,

  spawnPadding: {
    left: 56,
    right: 56,
  },

  // Start some images much closer to the viewport top
  // so a few are already visible on load.
  spawnY: {
    min: -420,
    max: 40,
  },

  widths: {
    back: { min: 130, max: 175 },
    mid: { min: 165, max: 215 },
    front: { min: 205, max: 255 },
  },

  scales: {
    back: { min: 0.72, max: 0.82 },
    mid: { min: 0.88, max: 1.0 },
    front: { min: 1.02, max: 1.12 },
  },

  aspectRatio: {
    min: 1.2,
    max: 1.45,
  },

  tilt: {
    rotationMin: -4,
    rotationMax: 4,
    wobbleAmount: 0.7,
    wobbleSpeedMin: 0.00035,
    wobbleSpeedMax: 0.0008,
  },

  orbit: {
    // Larger overall orbit, but your code should clamp or
    // reduce effective radius based on image width/layer.
    radius: {
      min: 65,
      max: 110,
    },
    speedMin: 0.00016,
    speedMax: 0.00034,
    scaleMin: 0.7,
    scaleMax: 1.1,

    // New optional per-layer caps so large front images
    // do not swing too far sideways.
    layerRadiusMax: {
      back: 110,
      mid: 90,
      front: 72,
    },
  },

  minHorizontalGap: 155,
  minVerticalGapAtSpawn: 260,
  maxSpawnPositionTries: 80,

  drift: {
    amount: 7,
    speedMin: 0.0002,
    speedMax: 0.00045,
  },

  depth: {
    back: { min: -260, max: -160 },
    mid: { min: -140, max: -40 },
    front: { min: -20, max: 70 },
  },

  removeOffset: 260,
};

const IMAGE_CONFIG = {
  totalImages: 59,
  favoredImageNumbers: [2, 5, 8],
  favoredWeight: 3,
  basePath: "/assets/images/gallery",
  filePrefix: "Layer ",
  fileExtension: ".png",
};

const imagePicker = createImagePicker(IMAGE_CONFIG);

const items = [];
let spawnTimeoutId = null;

function createItem(layerName) {
  const el = document.createElement("div");
  el.classList.add("gallery-item");

  const img = document.createElement("img");
  img.src = imagePicker.getRandomImagePath();
  img.alt = "";

  el.appendChild(img);

  const width = getRangeValue(CONFIG.widths[layerName]);
  const aspectRatio = getRangeValue(CONFIG.aspectRatio);
  const height = width * aspectRatio;
  const scale = getRangeValue(CONFIG.scales[layerName]);

  const baseRotation = randomBetween(
    CONFIG.tilt.rotationMin,
    CONFIG.tilt.rotationMax
  );

  const position = getSpawnPosition(gallery, items, CONFIG, width, scale);

  const speed =
    CONFIG.speeds[layerName] + Math.random() * CONFIG.speedVariance;

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

  const orbitRadius = randomBetween(
    CONFIG.orbit.radius.min,
    CONFIG.orbit.radius.max
  );
  const orbitSpeed = randomBetween(
    CONFIG.orbit.speedMin,
    CONFIG.orbit.speedMax
  );
  const orbitOffset = Math.random() * Math.PI * 2;

  const item = {
    el,
    layerName,
    width,
    height,
    scale,
    x: position.x,
    y: position.y,
    speed,
    baseRotation,
    wobbleSpeed,
    wobbleOffset,
    driftAmount,
    driftSpeed,
    driftOffset,
    orbitRadius,
    orbitSpeed,
    orbitOffset,
  };

  applyItemStyles(CONFIG, item);
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
  const layerName = pickRandomAvailableLayer(items, layers, CONFIG);
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

    item.el.style.transform = buildTransform(CONFIG, item, time);
  }

  requestAnimationFrame(animate);
}

function repositionItemsOnResize() {
  for (const item of items) {
    const position = getSpawnPosition(
      gallery,
      items,
      CONFIG,
      item.width,
      item.scale
    );

    item.x = position.x;
    applyItemStyles(CONFIG, item);
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
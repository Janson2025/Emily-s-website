export function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(max) {
  return Math.floor(Math.random() * max);
}

export function getRangeValue(range) {
  return randomBetween(range.min, range.max);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function buildWeightedImagePool(
  totalImages,
  favoredImageNumbers = [],
  favoredWeight = 0
) {
  const pool = [];

  for (let i = 1; i <= totalImages; i++) {
    pool.push(i);

    if (favoredImageNumbers.includes(i)) {
      for (let j = 0; j < favoredWeight; j++) {
        pool.push(i);
      }
    }
  }

  return pool;
}

export function createImagePicker({
  totalImages,
  favoredImageNumbers = [],
  favoredWeight = 0,
  basePath = "/assets/images/gallery",
  filePrefix = "Layer ",
  fileExtension = ".png",
}) {
  const weightedImagePool = buildWeightedImagePool(
    totalImages,
    favoredImageNumbers,
    favoredWeight
  );

  let lastImageNumber = null;

  function getRandomImageNumber() {
    if (weightedImagePool.length === 0) return 1;

    let imageNumber =
      weightedImagePool[randomInt(weightedImagePool.length)];

    if (weightedImagePool.length > 1 && imageNumber === lastImageNumber) {
      let rerollCount = 0;
      const maxRerolls = 10;

      while (imageNumber === lastImageNumber && rerollCount < maxRerolls) {
        imageNumber =
          weightedImagePool[randomInt(weightedImagePool.length)];
        rerollCount++;
      }
    }

    lastImageNumber = imageNumber;
    return imageNumber;
  }

  function getRandomImagePath() {
    const imageNumber = getRandomImageNumber();
    return `${basePath}/${filePrefix}${imageNumber}${fileExtension}`;
  }

  return {
    getRandomImageNumber,
    getRandomImagePath,
  };
}

export function getSpawnY(CONFIG) {
  return randomBetween(CONFIG.spawnY.min, CONFIG.spawnY.max);
}

export function getVisibleWidth(itemWidth, scale) {
  return itemWidth * scale;
}

export function getItemCenterXFromValues(x, width, scale) {
  return x + getVisibleWidth(width, scale) / 2;
}

export function getActiveCount(items, layerName) {
  return items.filter((item) => item.layerName === layerName).length;
}

export function getAvailableLayers(items, layers, CONFIG) {
  return Object.keys(layers).filter((layerName) => {
    return getActiveCount(items, layerName) < CONFIG.maxActive[layerName];
  });
}

export function pickRandomAvailableLayer(items, layers, CONFIG) {
  const available = getAvailableLayers(items, layers, CONFIG);
  if (available.length === 0) return null;
  return available[randomInt(available.length)];
}

export function getOrbitScaleMultiplier(CONFIG, item, time) {
  const orbitPhase = time * item.orbitSpeed + item.orbitOffset;
  const normalizedDepth = (Math.cos(orbitPhase) + 1) / 2;

  return (
    CONFIG.orbit.scaleMin +
    normalizedDepth * (CONFIG.orbit.scaleMax - CONFIG.orbit.scaleMin)
  );
}

export function isSpawnPositionValid(
  items,
  CONFIG,
  candidateX,
  candidateY,
  candidateWidth,
  candidateBaseScale
) {
  const candidateVisibleWidth = getVisibleWidth(
    candidateWidth,
    candidateBaseScale * CONFIG.orbit.scaleMax
  );
  const candidateCenterX = getItemCenterXFromValues(
    candidateX,
    candidateWidth,
    candidateBaseScale * CONFIG.orbit.scaleMax
  );

  for (const item of items) {
    const itemVisibleWidth = getVisibleWidth(
      item.width,
      item.scale * CONFIG.orbit.scaleMax
    );
    const itemCenterX = getItemCenterXFromValues(
      item.x,
      item.width,
      item.scale * CONFIG.orbit.scaleMax
    );

    const horizontalDistance = Math.abs(candidateCenterX - itemCenterX);
    const verticalDistance = Math.abs(candidateY - item.y);

    const requiredHorizontalGap =
      (candidateVisibleWidth + itemVisibleWidth) / 2 +
      CONFIG.minHorizontalGap;

    if (
      horizontalDistance < requiredHorizontalGap &&
      verticalDistance < CONFIG.minVerticalGapAtSpawn
    ) {
      return false;
    }
  }

  return true;
}

export function getSpawnPosition(gallery, items, CONFIG, itemWidth, baseScale) {
  const galleryWidth = gallery.clientWidth;
  const visibleWidth = getVisibleWidth(
    itemWidth,
    baseScale * CONFIG.orbit.scaleMax
  );

  const orbitPad = CONFIG.orbit.radius.max;

  const minX = CONFIG.spawnPadding.left + orbitPad;
  const maxX =
    galleryWidth - CONFIG.spawnPadding.right - visibleWidth - orbitPad;

  const safeMaxX = Math.max(minX, maxX);

  for (let i = 0; i < CONFIG.maxSpawnPositionTries; i++) {
    const x = randomBetween(minX, safeMaxX);
    const y = getSpawnY(CONFIG);

    if (isSpawnPositionValid(items, CONFIG, x, y, itemWidth, baseScale)) {
      return { x, y };
    }
  }

  return {
    x: randomBetween(minX, safeMaxX),
    y: getSpawnY(CONFIG),
  };
}

export function getLayerDepth(CONFIG, item, time) {
  const orbitPhase = time * item.orbitSpeed + item.orbitOffset;
  const normalizedDepth = (Math.cos(orbitPhase) + 1) / 2;

  return (
    CONFIG.depth[item.layerName].min +
    normalizedDepth *
      (CONFIG.depth[item.layerName].max - CONFIG.depth[item.layerName].min)
  );
}

export function buildTransform(CONFIG, item, time) {
  const orbitPhase = time * item.orbitSpeed + item.orbitOffset;

  const orbitX = Math.sin(orbitPhase) * item.orbitRadius;

  const depthScale = getOrbitScaleMultiplier(CONFIG, item, time);

  const horizontalDrift =
    Math.sin(time * item.driftSpeed + item.driftOffset) * item.driftAmount;

  const rotationWobble =
    Math.sin(time * item.wobbleSpeed + item.wobbleOffset) *
    CONFIG.tilt.wobbleAmount;

  const currentRotation = item.baseRotation + rotationWobble;

  const currentDepth = getLayerDepth(CONFIG, item, time);
  const currentScale = item.scale * depthScale;

  return `
    translate3d(${orbitX + horizontalDrift}px, ${item.y}px, ${currentDepth}px)
    scale(${currentScale})
    rotate(${currentRotation}deg)
  `;
}

export function applyItemStyles(CONFIG, item, time = performance.now()) {
  item.el.style.width = `${item.width}px`;
  item.el.style.height = `${item.height}px`;
  item.el.style.left = `${item.x}px`;
  item.el.style.transform = buildTransform(CONFIG, item, time);
}
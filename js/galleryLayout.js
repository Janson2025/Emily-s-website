import {
  randomBetween,
  randomInt,
  getVisibleWidth,
  getItemCenterXFromValues,
} from "./galleryUtils.js";

export function getSpawnY(CONFIG) {
  return randomBetween(CONFIG.spawnY.min, CONFIG.spawnY.max);
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
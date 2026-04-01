// galleryItemFactory.js

import { randomBetween, getRangeValue } from "./galleryUtils.js";
import { getSpawnPosition } from "./galleryLayout.js";
import { applyItemStyles } from "./galleryMotion.js";

let nextItemId = 1;

function createItemId() {
  return `gallery-item-${nextItemId++}`;
}

function getScaledDimensionsFromNatural(longSide, naturalWidth, naturalHeight) {
  if (!naturalWidth || !naturalHeight) {
    return {
      width: longSide,
      height: longSide,
    };
  }

  if (naturalWidth >= naturalHeight) {
    return {
      width: longSide,
      height: (naturalHeight / naturalWidth) * longSide,
    };
  }

  return {
    width: (naturalWidth / naturalHeight) * longSide,
    height: longSide,
  };
}

function getSpawnY({ state, config, itemHeight, spawnSide }) {
  const galleryHeight = state.gallery?.offsetHeight || window.innerHeight;
  const extraOffset = config.spawnEdgeOffset ?? 80;

  if (spawnSide === "bottom") {
    return galleryHeight + itemHeight + extraOffset;
  }

  return -itemHeight - extraOffset;
}

function updateItemDimensionsFromImage({
  item,
  img,
  longSide,
  state,
  config,
}) {
  const { width, height } = getScaledDimensionsFromNatural(
    longSide,
    img.naturalWidth,
    img.naturalHeight
  );

  item.width = width;
  item.height = height;

  const position = getSpawnPosition(
    state.gallery,
    state.items,
    config,
    item.width,
    item.scale
  );

  item.x = position.x;

  if (item.spawnSide === "top" && item.y > 0) {
    item.y = getSpawnY({
      state,
      config,
      itemHeight: item.height,
      spawnSide: "top",
    });
  }

  if (
    item.spawnSide === "bottom" &&
    item.y < (state.gallery?.offsetHeight || 0)
  ) {
    item.y = getSpawnY({
      state,
      config,
      itemHeight: item.height,
      spawnSide: "bottom",
    });
  }

  applyItemStyles(config, item);
}

function getLayerScrollResponsiveness(config, layerName) {
  const configured = config.scroll?.layerResponsiveness?.[layerName];

  if (typeof configured === "number") {
    return configured;
  }

  if (layerName === "back") return randomBetween(0.65, 0.9);
  if (layerName === "mid") return randomBetween(1.0, 1.35);
  return randomBetween(1.45, 1.9);
}

function getHoverDurations(config, layerName) {
  const hoverConfig = config.hover ?? {};

  const defaults = {
    back: hoverConfig.enterDurationMsSmall ?? 260,
    mid: hoverConfig.enterDurationMsMedium ?? 360,
    front: hoverConfig.enterDurationMsLarge ?? 480,
  };

  return {
    enterDurationMs:
      defaults[layerName] ?? hoverConfig.enterDurationMs ?? 420,
    leaveDurationMs: hoverConfig.leaveDurationMs ?? 320,
  };
}

/*
  This makes the base scale logic very explicit.

  There are now three clearly named layer scale groups:
  - back
  - mid
  - front

  The file first looks for a dedicated config block:
    config.layerScale.back
    config.layerScale.mid
    config.layerScale.front

  If that block does not exist, it falls back to config.scales[layerName].
*/
function getLayerScaleSettings(config, layerName) {
  const explicitLayerScale = config.layerScale?.[layerName];
  if (explicitLayerScale) {
    return explicitLayerScale;
  }

  return config.scales?.[layerName];
}

function getLayerBaseScale(config, layerName) {
  const scaleSettings = getLayerScaleSettings(config, layerName);

  if (!scaleSettings) {
    if (layerName === "back") return randomBetween(0.72, 0.82);
    if (layerName === "mid") return randomBetween(0.88, 1.0);
    return randomBetween(1.02, 1.12);
  }

  return getRangeValue(scaleSettings);
}

function getLayerWidthSettings(config, layerName) {
  return config.widths?.[layerName];
}

function getLayerBaseWidth(config, layerName) {
  const widthSettings = getLayerWidthSettings(config, layerName);

  if (!widthSettings) {
    if (layerName === "back") return randomBetween(130, 175);
    if (layerName === "mid") return randomBetween(165, 215);
    return randomBetween(205, 255);
  }

  return getRangeValue(widthSettings);
}

export function createGalleryItem({
  state,
  config,
  layerName,
  spawnSide = "top",
}) {
  const el = document.createElement("div");
  el.classList.add("gallery-item");

  const img = document.createElement("img");
  const src = state.imagePicker.getRandomImagePath();
  img.src = src;
  img.alt = "";

  el.appendChild(img);

  // --------------------------------
  // Explicit per-layer base size values
  // --------------------------------
  const longSide = getLayerBaseWidth(config, layerName);
  const scale = getLayerBaseScale(config, layerName);

  const baseRotation = randomBetween(
    config.tilt.rotationMin,
    config.tilt.rotationMax
  );

  const position = getSpawnPosition(
    state.gallery,
    state.items,
    config,
    longSide,
    scale
  );

  const speed =
    config.speeds[layerName] + Math.random() * config.speedVariance;

  const wobbleSpeed = randomBetween(
    config.tilt.wobbleSpeedMin,
    config.tilt.wobbleSpeedMax
  );
  const wobbleOffset = Math.random() * Math.PI * 2;

  const driftAmount = randomBetween(3, config.drift.amount);
  const driftSpeed = randomBetween(
    config.drift.speedMin,
    config.drift.speedMax
  );
  const driftOffset = Math.random() * Math.PI * 2;

  const orbitRadius = randomBetween(
    config.orbit.radius.min,
    config.orbit.radius.max
  );
  const orbitSpeed = randomBetween(
    config.orbit.speedMin,
    config.orbit.speedMax
  );
  const orbitOffset = Math.random() * Math.PI * 2;

  const hoverDurations = getHoverDurations(config, layerName);

  const item = {
    id: createItemId(),
    el,
    img,
    src,
    layerName,
    spawnSide,

    width: longSide,
    height: longSide,
    scale,

    x: position.x,
    y: 0,

    speed,
    scrollResponsiveness: getLayerScrollResponsiveness(config, layerName),

    baseRotation,
    wobbleSpeed,
    wobbleOffset,

    driftAmount,
    driftSpeed,
    driftOffset,

    orbitRadius,
    orbitSpeed,
    orbitOffset,

    hoverEnterDurationMs: hoverDurations.enterDurationMs,
    hoverLeaveDurationMs: hoverDurations.leaveDurationMs,

    isHovered: false,
    isPaused: false,
    isFocused: false,
    hoverIntentActive: false,
    hoverStartTime: 0,
    hoverReleaseTime: 0,
    hoverTimerId: null,
    hoverDelayTimeoutId: null,
    clickLocked: false,

    hoverState: "idle",
    hoverTarget: 0,
    hoverProgress: 0,
    focusOffsetX: 0,
    focusOffsetY: 0,
    hasHoverClass: false,
    promotedZIndex: null,

    galleryWidth: state.gallery?.offsetWidth || window.innerWidth,
    galleryHeight: state.gallery?.offsetHeight || window.innerHeight,
  };

  item.y = getSpawnY({
    state,
    config,
    itemHeight: item.height,
    spawnSide,
  });

  el.dataset.galleryItemId = item.id;

  applyItemStyles(config, item);

  if (img.complete && img.naturalWidth && img.naturalHeight) {
    updateItemDimensionsFromImage({ item, img, longSide, state, config });
  } else {
    img.addEventListener(
      "load",
      () => {
        updateItemDimensionsFromImage({ item, img, longSide, state, config });
      },
      { once: true }
    );

    img.addEventListener(
      "error",
      () => {
        console.warn(`Failed to load image: ${src}`);
      },
      { once: true }
    );
  }

  return item;
}
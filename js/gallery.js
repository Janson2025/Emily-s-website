import { getSpawnPosition, pickRandomAvailableLayer } from "./galleryLayout.js";
import { buildTransform, applyItemStyles } from "./galleryMotion.js";
import { CONFIG } from "./galleryConfig.js";
import { createGalleryState } from "./galleryState.js";
import { createGalleryItem } from "./galleryItemFactory.js";
import { setupGalleryInteractions } from "./galleryInteractions.js";
import { createGalleryModal } from "./galleryModal.js";
import { createGalleryScrollController } from "./galleryScroll.js";

const state = createGalleryState();
const modal = createGalleryModal();

const runtimeConfig = {
  ambientSpawnPerSecond: CONFIG.scroll?.ambientSpawnPerSecond ?? 0.4,
  scrollSpawnPerSecondFactor: CONFIG.scroll?.scrollSpawnPerSecondFactor ?? 2.0,
  reverseSpawnPerSecondFactor:
    CONFIG.scroll?.reverseSpawnPerSecondFactor ?? 2.0,
  reverseBurstThreshold: CONFIG.scroll?.reverseBurstThreshold ?? 1.2,
  reverseBurstCount: CONFIG.scroll?.reverseBurstCount ?? 2,
  maxFrameDtMs: CONFIG.scroll?.maxFrameDtMs ?? 34,
  minVisibleBottomEntrants: CONFIG.scroll?.minVisibleBottomEntrants ?? 2,
  minActiveItems: CONFIG.minActiveItems ?? 6,
};

state.spawnAccumulators = {
  top: 0,
  bottom: 0,
};

let lastFrameTime = performance.now();
let scrollController = null;
let nextPromotedZIndex = (CONFIG.hover?.promoteZIndex ?? 999) + 1;

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function addItem(layerName, spawnSide = "top") {
  const item = createGalleryItem({
    state,
    config: CONFIG,
    layerName,
    spawnSide,
  });

  if (item.hoverState == null) item.hoverState = "idle";
  if (item.hoverTarget == null) item.hoverTarget = 0;
  if (item.hoverProgress == null) item.hoverProgress = 0;
  if (item.focusOffsetX == null) item.focusOffsetX = 0;
  if (item.focusOffsetY == null) item.focusOffsetY = 0;
  if (item.hasHoverClass == null) item.hasHoverClass = false;
  if (item.promotedZIndex == null) item.promotedZIndex = null;

  state.layers[layerName].appendChild(item.el);
  state.items.push(item);

  return item;
}

function removeItem(item) {
  if (item.hoverDelayTimeoutId) {
    window.clearTimeout(item.hoverDelayTimeoutId);
    item.hoverDelayTimeoutId = null;
  }

  item.el.remove();

  const index = state.items.indexOf(item);
  if (index !== -1) {
    state.items.splice(index, 1);
  }
}

function trySpawnOne(spawnSide = "top") {
  const layerName = pickRandomAvailableLayer(
    state.items,
    state.layers,
    CONFIG
  );

  if (!layerName) return null;

  return addItem(layerName, spawnSide);
}

function ensureMinimumItems(scrollBoost = 0) {
  let safety = 0;
  const spawnSide = scrollBoost > 0 ? "bottom" : "top";

  while (state.items.length < runtimeConfig.minActiveItems && safety < 20) {
    trySpawnOne(spawnSide);
    safety += 1;
  }
}

function getItemVelocityY(item, scrollBoost) {
  const ambientDrift = item.speed * (CONFIG.motion?.ambientMultiplier ?? 1);
  const scrollForce =
    -scrollBoost *
    item.scrollResponsiveness *
    (CONFIG.motion?.scrollMultiplier ?? 1);

  return ambientDrift + scrollForce;
}

function isItemOutOfBounds(item, galleryHeight) {
  const removeOffset = CONFIG.removeOffset ?? 260;

  return (
    item.y > galleryHeight + item.height + removeOffset ||
    item.y < -item.height - removeOffset
  );
}

function countVisibleBottomEntrants(galleryHeight) {
  let count = 0;

  for (const item of state.items) {
    if (item.spawnSide !== "bottom") continue;
    if (item.y < 0 || item.y > galleryHeight) continue;
    count += 1;
  }

  return count;
}

function maybeForceReverseBurst(scrollBoost, galleryHeight) {
  const threshold = runtimeConfig.reverseBurstThreshold;

  if (scrollBoost >= -threshold) return;

  const visibleBottomEntrants = countVisibleBottomEntrants(galleryHeight);

  if (visibleBottomEntrants >= runtimeConfig.minVisibleBottomEntrants) return;

  for (let i = 0; i < runtimeConfig.reverseBurstCount; i++) {
    trySpawnOne("bottom");
  }
}

function updateSpawnAccumulators(dtSeconds, scrollBoost) {
  const magnitude = Math.abs(scrollBoost);

  if (scrollBoost > 0) {
    state.spawnAccumulators.bottom +=
      runtimeConfig.ambientSpawnPerSecond * dtSeconds +
      magnitude * runtimeConfig.scrollSpawnPerSecondFactor * dtSeconds;
  } else {
    state.spawnAccumulators.top +=
      runtimeConfig.ambientSpawnPerSecond * dtSeconds +
      magnitude * runtimeConfig.reverseSpawnPerSecondFactor * dtSeconds;
  }
}

function consumeSpawnAccumulators() {
  while (state.spawnAccumulators.top >= 1) {
    state.spawnAccumulators.top -= 1;
    trySpawnOne("top");
  }

  while (state.spawnAccumulators.bottom >= 1) {
    state.spawnAccumulators.bottom -= 1;
    trySpawnOne("bottom");
  }
}

function updateItemHoverProgress(item, dtMs) {
  const target = item.hoverTarget ?? 0;
  const current = item.hoverProgress ?? 0;

  const enterDuration =
    item.hoverEnterDurationMs ??
    CONFIG.hover?.enterDurationMs ??
    420;

  const leaveDuration =
    item.hoverLeaveDurationMs ??
    CONFIG.hover?.leaveDurationMs ??
    320;

  const duration = target > current ? enterDuration : leaveDuration;
  const step = duration > 0 ? dtMs / duration : 1;

  item.hoverProgress = lerp(current, target, Math.min(step, 1));

  if (Math.abs(item.hoverProgress - target) < 0.001) {
    item.hoverProgress = target;
  }

  if (item.hoverProgress >= 1 && item.hoverState === "entering") {
    item.hoverState = "focused";
  }

  if (item.hoverProgress <= 0 && item.hoverState === "leaving") {
    item.hoverState = "idle";
    item.isFocused = false;
    item.focusOffsetX = 0;
    item.focusOffsetY = 0;
    item.promotedZIndex = null;
    item.el.style.zIndex = "";
  }
}

function updateItemFocusOffsets(item) {
  const gallery = state.gallery;
  if (!gallery) return;

  const hoverProgress = item.hoverProgress ?? 0;

  if (hoverProgress <= 0 && !item.isFocused) {
    item.focusOffsetX = 0;
    item.focusOffsetY = 0;
    return;
  }

  const galleryWidth = gallery.clientWidth;
  const galleryHeight = gallery.clientHeight;

  const orbitScaleGuess = (CONFIG.orbit.scaleMin + CONFIG.orbit.scaleMax) / 2;

  const hoverScaleMultiplier =
    1 + ((CONFIG.hover?.scaleMultiplier ?? 1.12) - 1) * hoverProgress;

  const visualScale = item.scale * orbitScaleGuess * hoverScaleMultiplier;
  const visualWidth = item.width * visualScale;
  const visualHeight = item.height * visualScale;

  const currentCenterX = item.x + visualWidth / 2;
  const currentCenterY = item.y + visualHeight / 2;

  const targetCenterX = galleryWidth / 2;
  const targetCenterY = galleryHeight / 2;

  const targetOffsetX = targetCenterX - currentCenterX;
  const targetOffsetY = targetCenterY - currentCenterY;

  const moveStartThreshold = CONFIG.hover?.centerMoveStart ?? 0.22;

  if (hoverProgress <= moveStartThreshold) {
    item.focusOffsetX = lerp(item.focusOffsetX ?? 0, 0, 0.28);
    item.focusOffsetY = lerp(item.focusOffsetY ?? 0, 0, 0.28);
    return;
  }

  const normalizedMoveProgress =
    (hoverProgress - moveStartThreshold) / (1 - moveStartThreshold);

  const gatedTargetOffsetX = targetOffsetX * normalizedMoveProgress;
  const gatedTargetOffsetY = targetOffsetY * normalizedMoveProgress;

  const lerpAmount =
    item.isHovered || item.isFocused
      ? CONFIG.hover?.centerLerp ?? 0.08
      : CONFIG.hover?.uncenterLerp ?? 0.12;

  item.focusOffsetX = lerp(item.focusOffsetX ?? 0, gatedTargetOffsetX, lerpAmount);
  item.focusOffsetY = lerp(item.focusOffsetY ?? 0, gatedTargetOffsetY, lerpAmount);
}

function updateItemZIndex(item) {
  const promoteThreshold = CONFIG.hover?.zIndexPromoteAt ?? 0.08;
  const fastPromoteZIndex = CONFIG.hover?.promoteZIndex ?? 999;

  if ((item.hoverProgress ?? 0) > promoteThreshold) {
    if (!item.promotedZIndex) {
      item.promotedZIndex = Math.max(nextPromotedZIndex++, fastPromoteZIndex);
    }

    item.el.style.zIndex = String(item.promotedZIndex);
    return;
  }

  if (!item.isFocused && (item.hoverProgress ?? 0) <= 0) {
    item.promotedZIndex = null;
    item.el.style.zIndex = "";
  }
}

function animate(time = performance.now()) {
  const rawDtMs = time - lastFrameTime;
  const dtMs = Math.min(rawDtMs, runtimeConfig.maxFrameDtMs);
  const dtFrames = dtMs / 16.6667;
  const dtSeconds = dtMs / 1000;
  const galleryHeight = state.gallery.offsetHeight;

  lastFrameTime = time;

  let scrollBoost = 0;

  if (scrollController) {
    scrollController.update();
    scrollBoost = scrollController.getBoost();
  }

  ensureMinimumItems(scrollBoost);
  updateSpawnAccumulators(dtSeconds, scrollBoost);
  maybeForceReverseBurst(scrollBoost, galleryHeight);
  consumeSpawnAccumulators();

  for (let i = state.items.length - 1; i >= 0; i--) {
    const item = state.items[i];

    updateItemHoverProgress(item, dtMs);
    updateItemZIndex(item);
    updateItemFocusOffsets(item);

    if (!item.isPaused) {
      const velocityY = getItemVelocityY(item, scrollBoost);
      item.y += velocityY * dtFrames;
    }

    if (isItemOutOfBounds(item, galleryHeight) && !item.isFocused) {
      removeItem(item);
      continue;
    }

    item.el.style.transform = buildTransform(CONFIG, item, time);
  }

  requestAnimationFrame(animate);
}

function repositionItemsOnResize() {
  for (const item of state.items) {
    const position = getSpawnPosition(
      state.gallery,
      state.items,
      CONFIG,
      item.width,
      item.scale
    );

    item.x = position.x;
    item.focusOffsetX = 0;
    item.focusOffsetY = 0;

    applyItemStyles(CONFIG, item);
  }
}

window.addEventListener("resize", repositionItemsOnResize);

function seedInitialItems() {
  const initialCount = CONFIG.initialItemCount ?? 6;

  for (let i = 0; i < initialCount; i++) {
    trySpawnOne("top");
  }
}

function initGallery() {
  if (!state.gallery) return;

  scrollController = createGalleryScrollController(
    state.gallery,
    CONFIG.scroll?.controller
  );

  setupGalleryInteractions({
    state,
    config: CONFIG,
    modal,
  });

  seedInitialItems();
  ensureMinimumItems();
  animate();
}

initGallery();
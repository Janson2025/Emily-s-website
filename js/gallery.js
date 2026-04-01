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

function addItem(layerName, spawnSide = "top") {
  const item = createGalleryItem({
    state,
    config: CONFIG,
    layerName,
    spawnSide,
  });

  state.layers[layerName].appendChild(item.el);
  state.items.push(item);

  return item;
}

function removeItem(item) {
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
    // items are moving upward, so bring replacements in from below
    state.spawnAccumulators.bottom +=
      runtimeConfig.ambientSpawnPerSecond * dtSeconds +
      magnitude * runtimeConfig.scrollSpawnPerSecondFactor * dtSeconds;
  } else {
    // items are moving downward, so bring replacements in from above
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

    if (!item.isPaused) {
      const velocityY = getItemVelocityY(item, scrollBoost);
      item.y += velocityY * dtFrames;
    }

    if (isItemOutOfBounds(item, galleryHeight)) {
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
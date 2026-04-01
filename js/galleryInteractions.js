import { findItemByElement } from "./galleryItems.js";

function clearHoverDelay(item) {
  if (item.hoverDelayTimeoutId) {
    window.clearTimeout(item.hoverDelayTimeoutId);
    item.hoverDelayTimeoutId = null;
  }
}

function applyHoverClass(item) {
  if (item.hasHoverClass) return;

  item.el.classList.add("is-hover-focused");
  item.hasHoverClass = true;
}

function removeHoverClass(item) {
  if (!item.hasHoverClass) return;

  item.el.classList.remove("is-hover-focused");
  item.hasHoverClass = false;
}

function beginHoverPending(item, config, modal) {
  if (!item) return;
  if (config.hover?.enabled === false) return;
  if (modal?.isOpen?.()) return;

  clearHoverDelay(item);

  item.hoverState = "pending";

  item.hoverDelayTimeoutId = window.setTimeout(() => {
    item.hoverDelayTimeoutId = null;

    if (modal?.isOpen?.()) return;

    item.isHovered = true;
    item.isPaused = true;
    item.isFocused = true;

    item.hoverTarget = 1;
    item.hoverState = "entering";

    applyHoverClass(item);
  }, config.hover?.delayMs ?? 180);
}

function endHover(item) {
  if (!item) return;

  clearHoverDelay(item);

  item.isHovered = false;
  item.hoverTarget = 0;
  item.isPaused = false;

  if ((item.hoverProgress ?? 0) > 0) {
    item.hoverState = "leaving";
  } else {
    item.hoverState = "idle";
    item.isFocused = false;
  }

  removeHoverClass(item);
}

function lockItemForModal(item, config) {
  if (!item) return;

  clearHoverDelay(item);

  item.isHovered = false;
  item.isPaused = true;
  item.isFocused = true;
  item.hoverTarget = 1;
  item.hoverState = "focused";

  applyHoverClass(item);

  if (config.hover?.clickPromoteZIndex) {
    item.promotedZIndex = config.hover.clickPromoteZIndex;
    item.el.style.zIndex = String(config.hover.clickPromoteZIndex);
  }
}

export function setupGalleryInteractions({ state, config, modal }) {
  if (!state.gallery) return;

  function onWheel(event) {
    // Reserved for the scroll controller.
    // Intentionally left empty here.
  }

  function onPointerOver(event) {
    if (modal?.isOpen?.()) return;

    const item = findItemByElement(state.items, event.target);
    if (!item) return;

    if (
      item.hoverState === "pending" ||
      item.hoverState === "entering" ||
      item.hoverState === "focused" ||
      item.isHovered
    ) {
      return;
    }

    beginHoverPending(item, config, modal);
  }

  function onPointerOut(event) {
    const item = findItemByElement(state.items, event.target);
    if (!item) return;

    const relatedTarget = event.relatedTarget;
    if (relatedTarget && item.el.contains(relatedTarget)) {
      return;
    }

    endHover(item);
  }

  function onClick(event) {
    const item = findItemByElement(state.items, event.target);
    if (!item) return;
    if (modal?.isOpen?.()) return;

    lockItemForModal(item, config);
    modal.open(item.src, item.img.alt || "");
  }

  state.gallery.addEventListener("wheel", onWheel, { passive: false });
  state.gallery.addEventListener("pointerover", onPointerOver);
  state.gallery.addEventListener("pointerout", onPointerOut);
  state.gallery.addEventListener("click", onClick);
}
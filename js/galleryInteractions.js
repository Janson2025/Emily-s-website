import { findItemByElement } from "./galleryItems.js";

export function setupGalleryInteractions({ state, config, modal }) {
  if (!state.gallery) return;

  function onWheel(event) {
    // Future:
    // - accelerate gallery movement
    // - allow reverse direction
    // - trigger extra spawning from top or bottom
  }

  function onPointerOver(event) {
    const item = findItemByElement(state.items, event.target);
    if (!item) return;

    // Future:
    // - pause movement
    // - scale slightly
    // - bring to front
    item.isHovered = true;
  }

  function onPointerOut(event) {
    const item = findItemByElement(state.items, event.target);
    if (!item) return;

    // Future:
    // - restore normal state
    item.isHovered = false;
  }

  function onClick(event) {
    const item = findItemByElement(state.items, event.target);
    if (!item) return;

    // Future:
    // - open modal with larger image
    // modal.open(item.src, item.img.alt || "");
  }

  state.gallery.addEventListener("wheel", onWheel, { passive: false });
  state.gallery.addEventListener("pointerover", onPointerOver);
  state.gallery.addEventListener("pointerout", onPointerOut);
  state.gallery.addEventListener("click", onClick);
}
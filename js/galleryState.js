import { createImagePicker } from "./galleryImages.js";
import { IMAGE_CONFIG } from "./galleryConfig.js";

export function createGalleryState() {
  const gallery = document.getElementById("gallery");

  const layers = {
    back: document.querySelector(".gallery-back"),
    mid: document.querySelector(".gallery-mid"),
    front: document.querySelector(".gallery-front"),
  };

  return {
    gallery,
    layers,
    imagePicker: createImagePicker(IMAGE_CONFIG),
    items: [],
    spawnTimeoutId: null,
  };
}
const DEFAULTS = {
  smoothing: 0.2,
  targetDecay: 0.9,
  maxBoost: 5,
  sensitivity: 0.06,
  deadzone: 0.05,
};

export function createGalleryScrollController(galleryEl, options = {}) {
  const settings = { ...DEFAULTS, ...options };

  const state = {
    targetBoost: 0,
    boost: 0,
    direction: 0,
    isPointerOverGallery: false,
  };

  function onPointerEnter() {
    state.isPointerOverGallery = true;
  }

  function onPointerLeave() {
    state.isPointerOverGallery = false;
  }

  function onWheel(event) {
    if (!state.isPointerOverGallery) return;

    event.preventDefault();

    const delta = event.deltaY;
    const nextTarget = delta * settings.sensitivity;

    state.targetBoost = clamp(
      state.targetBoost + nextTarget,
      -settings.maxBoost,
      settings.maxBoost
    );

    if (delta > 0) {
      state.direction = 1;
    } else if (delta < 0) {
      state.direction = -1;
    }
  }

  function update() {
    state.boost += (state.targetBoost - state.boost) * settings.smoothing;
    state.targetBoost *= settings.targetDecay;

    if (Math.abs(state.targetBoost) < settings.deadzone) {
      state.targetBoost = 0;
    }

    if (Math.abs(state.boost) < settings.deadzone) {
      state.boost = 0;
    }

    if (state.boost > settings.deadzone) {
      state.direction = 1;
    } else if (state.boost < -settings.deadzone) {
      state.direction = -1;
    } else {
      state.direction = 0;
    }
  }

  function getBoost() {
    return state.boost;
  }

  function getDirection() {
    return state.direction;
  }

  function getMagnitude() {
    return Math.abs(state.boost);
  }

  function destroy() {
    galleryEl.removeEventListener("mouseenter", onPointerEnter);
    galleryEl.removeEventListener("mouseleave", onPointerLeave);
    galleryEl.removeEventListener("wheel", onWheel, wheelListenerOptions);
  }

  const wheelListenerOptions = { passive: false };

  galleryEl.addEventListener("mouseenter", onPointerEnter);
  galleryEl.addEventListener("mouseleave", onPointerLeave);
  galleryEl.addEventListener("wheel", onWheel, wheelListenerOptions);

  return {
    update,
    getBoost,
    getDirection,
    getMagnitude,
    destroy,
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
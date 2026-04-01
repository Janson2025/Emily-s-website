// galleryConfig.js

// ==============================
// GALLERY BEHAVIOR CONFIG
// ==============================

export const CONFIG = {
  motion: {
    ambientMultiplier: 1.35,
    scrollMultiplier: 0.22,
  },

  minActiveItems: 6,

  // ------------------------------
  // Layer population limits
  // ------------------------------
  maxActive: {
    back: 7,
    mid: 3,
    front: 2,
  },

  // ------------------------------
  // Initial gallery seeding
  // ------------------------------
  initialItemCount: 6,

  // ------------------------------
  // Movement speeds
  // ------------------------------
  speeds: {
    back: 0.35,
    mid: 0.55,
    front: 0.8,
  },

  speedVariance: 0.14,

  // ------------------------------
  // Spawn positioning
  // ------------------------------
  spawnPadding: {
    left: 56,
    right: 56,
  },

  spawnY: {
    min: -420,
    max: 40,
  },

  spawnEdgeOffset: 80,

  // ------------------------------
  // Image sizing
  // ------------------------------
  widths: {
    back: { min: 260, max: 280 },
    mid: { min: 220, max: 240 },
    front: { min: 180, max: 200 },
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

  // ------------------------------
  // Rotation / wobble
  // ------------------------------
  tilt: {
    rotationMin: -4,
    rotationMax: 4,
    wobbleAmount: 0.7,
    wobbleSpeedMin: 0.00035,
    wobbleSpeedMax: 0.0008,
  },

  // ------------------------------
  // Orbit motion
  // ------------------------------
  orbit: {
    radius: {
      min: 65,
      max: 110,
    },

    speedMin: 0.00016,
    speedMax: 0.00034,

    scaleMin: 0.7,
    scaleMax: 1.1,

    layerRadiusMax: {
      back: 110,
      mid: 90,
      front: 72,
    },
  },

  // ------------------------------
  // Spawn spacing constraints
  // ------------------------------
  minHorizontalGap: 1200,
  minVerticalGapAtSpawn: 600,
  maxSpawnPositionTries: 30,

  // ------------------------------
  // Horizontal drift
  // ------------------------------
  drift: {
    amount: 24,
    speedMin: 0.0002,
    speedMax: 0.00045,
  },

  // ------------------------------
  // Depth (Z positioning)
  // ------------------------------
  depth: {
    back: { min: -260, max: -160 },
    mid: { min: -140, max: -40 },
    front: { min: -20, max: 70 },
  },

  // ------------------------------
  // Removal bounds
  // ------------------------------
  removeOffset: 260,

  // ------------------------------
  // Hover / focus behavior
  // ------------------------------
  hover: {
    enterDurationMsSmall: 260,
    enterDurationMsMedium: 360,
    enterDurationMsLarge: 480,
    leaveDurationMs: 320,
    holdDelayMs: 180,
    liftDurationMs: 120,
    centerMoveDurationMs: 280,
    scaleBoost: 0.24,
    shadowBlurMin: 14,
    shadowBlurMax: 34,
    shadowOpacityMin: 0.14,
    shadowOpacityMax: 0.38,
    zIndexHover: 120,
    zIndexClick: 140,
    centerYOffset: -18,
  },

  // ------------------------------
  // Scroll-driven movement + spawning
  // ------------------------------
  scroll: {
    ambientSpawnPerSecond: 0.65,
    scrollSpawnPerSecondFactor: 20.5,
    reverseSpawnPerSecondFactor: 20.5,
    reverseBurstThreshold: 1.2,
    reverseBurstCount: 1.2,
    minVisibleBottomEntrants: 2,
    maxFrameDtMs: 14,

    layerResponsiveness: {
      back: 3,
      mid: 4,
      front: 7,
    },

    controller: {
      smoothing: 0.12,
      targetDecay: 0.82,
      maxBoost: 6,
      sensitivity: 110,
      deadzone: 0.015,
    },
  },
};

// ==============================
// IMAGE PICKING CONFIG
// ==============================

export const IMAGE_CONFIG = {
  totalImages: 112,

  favoredImageNumbers: [2, 5, 8],
  favoredWeight: 3,

  basePath: "assets/images/gallery",
  filePrefix: "Layer ",
  fileExtension: ".png",
};
// galleryConfig.js

// ==============================
// GALLERY BEHAVIOR CONFIG
// ==============================

export const CONFIG = {

  motion: {
    ambientMultiplier: 1.35,
    scrollMultiplier: 0.22,
  },

  minActiveItems: 12,
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
  initialItemCount: 12,

  // ------------------------------
  // Movement speeds
  // Used when not actively scrolling
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
    back: { min: 130, max: 175 },
    mid: { min: 165, max: 215 },
    front: { min: 205, max: 255 },
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
  minHorizontalGap: 155,
  minVerticalGapAtSpawn: 260,
  maxSpawnPositionTries: 80,

  // ------------------------------
  // Horizontal drift
  // ------------------------------
  drift: {
    amount: 7,
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
  // Scroll-driven movement + spawning
  // ------------------------------
  scroll: {
        ambientSpawnPerSecond: 0.65,
        scrollSpawnPerSecondFactor: 6.5,
        reverseSpawnPerSecondFactor: 6.5,
        reverseBurstThreshold: 0.2,
        reverseBurstCount: 2,
        minVisibleBottomEntrants: 2,
        maxFrameDtMs: 14,

        layerResponsiveness: {
            back: 44,
            mid: 22,
            front: 10,
        },

        controller: {
            smoothing: 0.12,
            targetDecay: 0.82,
            maxBoost: 2,
            sensitivity: 110,
            deadzone: 0.03,
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
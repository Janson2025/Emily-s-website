export function getOrbitScaleMultiplier(CONFIG, item, time) {
  const orbitPhase = time * item.orbitSpeed + item.orbitOffset;
  const normalizedDepth = (Math.cos(orbitPhase) + 1) / 2;

  return (
    CONFIG.orbit.scaleMin +
    normalizedDepth * (CONFIG.orbit.scaleMax - CONFIG.orbit.scaleMin)
  );
}

export function getLayerDepth(CONFIG, item, time) {
  const orbitPhase = time * item.orbitSpeed + item.orbitOffset;
  const normalizedDepth = (Math.cos(orbitPhase) + 1) / 2;

  return (
    CONFIG.depth[item.layerName].min +
    normalizedDepth *
      (CONFIG.depth[item.layerName].max - CONFIG.depth[item.layerName].min)
  );
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function lerp(start, end, t) {
  return start + (end - start) * t;
}

function easeInOut(t) {
  const x = clamp01(t);

  return x < 0.5
    ? 2 * x * x
    : 1 - Math.pow(-2 * x + 2, 2) / 2;
}

function getNormalTransformValues(CONFIG, item, time) {
  const orbitPhase = time * item.orbitSpeed + item.orbitOffset;

  const orbitX = Math.sin(orbitPhase) * item.orbitRadius;
  const depthScale = getOrbitScaleMultiplier(CONFIG, item, time);

  const horizontalDrift =
    Math.sin(time * item.driftSpeed + item.driftOffset) * item.driftAmount;

  const rotationWobble =
    Math.sin(time * item.wobbleSpeed + item.wobbleOffset) *
    CONFIG.tilt.wobbleAmount;

  const rotation = item.baseRotation + rotationWobble;
  const depth = getLayerDepth(CONFIG, item, time);
  const scale = item.scale * depthScale;

  return {
    x: orbitX + horizontalDrift,
    y: item.y,
    scale,
    rotation,
    depth,
  };
}

function getGalleryCenterOffsets(item) {
  return {
    x: item.focusOffsetX ?? 0,
    y: item.focusOffsetY ?? 0,
  };
}

function getFocusedTransformValues(CONFIG, item, time) {
  const normal = getNormalTransformValues(CONFIG, item, time);
  const offsets = getGalleryCenterOffsets(item);

  return {
    x: normal.x + offsets.x,
    y: normal.y + offsets.y,
    scale: normal.scale * (CONFIG.hover?.scaleMultiplier ?? 1.12),
    rotation:
      normal.rotation * (CONFIG.hover?.focusRotationDampen ?? 0.35),
    depth: normal.depth + (CONFIG.hover?.focusDepthBoost ?? 140),
  };
}

export function buildTransform(CONFIG, item, time) {
  const normal = getNormalTransformValues(CONFIG, item, time);
  const focus = getFocusedTransformValues(CONFIG, item, time);

  const hoverProgress = item.hoverProgress ?? 0;
  const easedHover = easeInOut(hoverProgress);

  const finalX = lerp(normal.x, focus.x, easedHover);
  const finalY = lerp(normal.y, focus.y, easedHover);
  const finalScale = lerp(normal.scale, focus.scale, easedHover);
  const finalRotation = lerp(normal.rotation, focus.rotation, easedHover);
  const finalDepth = lerp(normal.depth, focus.depth, easedHover);

  return `
    translate3d(${finalX}px, ${finalY}px, ${finalDepth}px)
    scale(${finalScale})
    rotate(${finalRotation}deg)
  `;
}

export function applyItemStyles(CONFIG, item, time = performance.now()) {
  item.el.style.width = `${item.width}px`;
  item.el.style.height = `${item.height}px`;
  item.el.style.left = `${item.x}px`;
  item.el.style.transform = buildTransform(CONFIG, item, time);
}
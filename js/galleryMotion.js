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

export function buildTransform(CONFIG, item, time) {
  const orbitPhase = time * item.orbitSpeed + item.orbitOffset;

  const orbitX = Math.sin(orbitPhase) * item.orbitRadius;
  const depthScale = getOrbitScaleMultiplier(CONFIG, item, time);

  const horizontalDrift =
    Math.sin(time * item.driftSpeed + item.driftOffset) * item.driftAmount;

  const rotationWobble =
    Math.sin(time * item.wobbleSpeed + item.wobbleOffset) *
    CONFIG.tilt.wobbleAmount;

  const currentRotation = item.baseRotation + rotationWobble;
  const currentDepth = getLayerDepth(CONFIG, item, time);
  const currentScale = item.scale * depthScale;

  return `
    translate3d(${orbitX + horizontalDrift}px, ${item.y}px, ${currentDepth}px)
    scale(${currentScale})
    rotate(${currentRotation}deg)
  `;
}

export function applyItemStyles(CONFIG, item, time = performance.now()) {
  item.el.style.width = `${item.width}px`;
  item.el.style.height = `${item.height}px`;
  item.el.style.left = `${item.x}px`;
  item.el.style.transform = buildTransform(CONFIG, item, time);
}
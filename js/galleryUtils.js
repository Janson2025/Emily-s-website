export function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function randomInt(max) {
  return Math.floor(Math.random() * max);
}

export function getRangeValue(range) {
  return randomBetween(range.min, range.max);
}

export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export function getVisibleWidth(itemWidth, scale) {
  return itemWidth * scale;
}

export function getItemCenterXFromValues(x, width, scale) {
  return x + getVisibleWidth(width, scale) / 2;
}
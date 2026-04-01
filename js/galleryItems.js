export function findItemById(items, id) {
  return items.find((item) => item.id === id) ?? null;
}

export function findItemByElement(items, element) {
  if (!element) return null;

  const itemEl = element.closest(".gallery-item");
  if (!itemEl) return null;

  const itemId = itemEl.dataset.galleryItemId;
  if (!itemId) return null;

  return findItemById(items, itemId);
}
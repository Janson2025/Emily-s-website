export function createGalleryModal() {
  let overlay = null;
  let dialog = null;
  let image = null;
  let isOpen = false;

  function ensureElements() {
    if (overlay) return;

    overlay = document.createElement("div");
    overlay.className = "gallery-modal-overlay";
    overlay.hidden = true;

    dialog = document.createElement("div");
    dialog.className = "gallery-modal-dialog";

    image = document.createElement("img");
    image.className = "gallery-modal-image";
    image.alt = "";

    dialog.appendChild(image);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        close();
      }
    });
  }

  function open(src, alt = "") {
    ensureElements();
    image.src = src;
    image.alt = alt;
    overlay.hidden = false;
    isOpen = true;
  }

  function close() {
    if (!overlay) return;
    overlay.hidden = true;
    isOpen = false;
  }

  return {
    open,
    close,
    isOpen: () => isOpen,
  };
}
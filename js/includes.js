async function loadInclude(selector, file) {
  const target = document.querySelector(selector);
  if (!target) return;

  try {
    const response = await fetch(file);
    if (!response.ok) {
      throw new Error(`Failed to load ${file}: ${response.status}`);
    }

    const html = await response.text();
    target.innerHTML = html;
  } catch (error) {
    console.error(error);
  }
}

async function loadSharedParts() {
  await loadInclude("#site-header", "partials/header.html");
  await loadInclude("#site-footer", "partials/footer.html");
}

loadSharedParts();
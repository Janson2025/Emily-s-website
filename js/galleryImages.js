import { randomInt } from "./galleryUtils.js";

export function buildWeightedImagePool(
  totalImages,
  favoredImageNumbers = [],
  favoredWeight = 0
) {
  const pool = [];

  for (let i = 1; i <= totalImages; i++) {
    pool.push(i);

    if (favoredImageNumbers.includes(i)) {
      for (let j = 0; j < favoredWeight; j++) {
        pool.push(i);
      }
    }
  }

  return pool;
}

export function createImagePicker({
  totalImages,
  favoredImageNumbers = [],
  favoredWeight = 0,
  basePath = "assets/images/gallery",
  filePrefix = "Layer ",
  fileExtension = ".png",
}) {
  const weightedImagePool = buildWeightedImagePool(
    totalImages,
    favoredImageNumbers,
    favoredWeight
  );

  let lastImageNumber = null;

  function getRandomImageNumber() {
    if (weightedImagePool.length === 0) return 1;

    let imageNumber = weightedImagePool[randomInt(weightedImagePool.length)];

    if (weightedImagePool.length > 1 && imageNumber === lastImageNumber) {
      let rerollCount = 0;
      const maxRerolls = 10;

      while (imageNumber === lastImageNumber && rerollCount < maxRerolls) {
        imageNumber = weightedImagePool[randomInt(weightedImagePool.length)];
        rerollCount++;
      }
    }

    lastImageNumber = imageNumber;
    return imageNumber;
  }

  function getRandomImagePath() {
    const imageNumber = getRandomImageNumber();
    return `${basePath}/${filePrefix}${imageNumber}${fileExtension}`;
  }

  return {
    getRandomImageNumber,
    getRandomImagePath,
  };
}
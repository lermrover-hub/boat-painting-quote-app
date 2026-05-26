import type { PhotoAreaEstimate } from "../types";

const maxAnalysisWidth = 720;

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not read image file."));
    image.src = URL.createObjectURL(file);
  });

export async function estimateBoatAreaFromImage(
  file: File,
  actualLengthMeters: number,
  surfaceMultiplier: number
): Promise<PhotoAreaEstimate> {
  if (!file.type.match(/^image\/(jpeg|png)$/)) {
    throw new Error("Upload a JPEG or PNG image.");
  }
  if (actualLengthMeters <= 0) {
    throw new Error("Enter the real boat length before estimating from a photo.");
  }

  const image = await loadImage(file);
  const scale = Math.min(1, maxAnalysisWidth / image.naturalWidth);
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Image analysis is not supported in this browser.");

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);
  URL.revokeObjectURL(image.src);

  const { data } = context.getImageData(0, 0, width, height);
  const samplePixels: number[][] = [];
  const sampleMarginX = Math.max(1, Math.floor(width * 0.08));
  const sampleMarginY = Math.max(1, Math.floor(height * 0.08));

  for (let y = 0; y < height; y += Math.max(1, Math.floor(height / 40))) {
    for (let x = 0; x < width; x += Math.max(1, Math.floor(width / 40))) {
      if (x < sampleMarginX || x > width - sampleMarginX || y < sampleMarginY || y > height - sampleMarginY) {
        const index = (y * width + x) * 4;
        samplePixels.push([data[index], data[index + 1], data[index + 2]]);
      }
    }
  }

  const background = samplePixels.reduce(
    (sum, pixel) => [sum[0] + pixel[0], sum[1] + pixel[1], sum[2] + pixel[2]],
    [0, 0, 0]
  ).map((value) => value / Math.max(samplePixels.length, 1));

  let detectedPixelCount = 0;
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4;
      const r = data[index];
      const g = data[index + 1];
      const b = data[index + 2];
      const brightness = (r + g + b) / 3;
      const colorDistance = Math.hypot(r - background[0], g - background[1], b - background[2]);
      const edgeBias = x > sampleMarginX && x < width - sampleMarginX && y > sampleMarginY && y < height - sampleMarginY;

      if (edgeBias && colorDistance > 42 && brightness < 245) {
        detectedPixelCount += 1;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const detectedWidthPixels = Math.max(1, maxX - minX + 1);
  const detectedHeightPixels = Math.max(1, maxY - minY + 1);
  const metersPerPixel = actualLengthMeters / detectedWidthPixels;
  const profileArea = detectedPixelCount * metersPerPixel * metersPerPixel;
  const estimatedSurfaceArea = profileArea * surfaceMultiplier;
  const coverageRatio = detectedPixelCount / (detectedWidthPixels * detectedHeightPixels);
  const confidence = coverageRatio > 0.22 && coverageRatio < 0.78 ? "Medium" : "Low";

  return {
    imageName: file.name,
    actualLengthMeters,
    surfaceMultiplier,
    imageWidth: width,
    imageHeight: height,
    detectedWidthPixels,
    detectedHeightPixels,
    detectedPixelCount,
    profileArea,
    estimatedSurfaceArea,
    confidence,
    createdAt: new Date().toISOString()
  };
}

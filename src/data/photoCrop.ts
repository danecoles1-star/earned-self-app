export type PhotoCrop = { x: number; y: number; zoom: number };
/** Normalized positions refer to the available travel, so no crop exposes empty pixels. */
export function cropRectangle(width: number, height: number, crop: PhotoCrop) {
  const clamp = (n: number, min: number, max: number) =>
    Math.max(min, Math.min(max, Number.isFinite(n) ? n : min));
  const edge = Math.min(width, height) / clamp(crop.zoom, 1, 3);
  return {
    edge,
    x: (width - edge) * clamp(crop.x, 0, 1),
    y: (height - edge) * clamp(crop.y, 0, 1),
  };
}

export type CropPoint = { x: number; y: number };
/** Pinch and pan anchor the same image point under the fingers. Coordinates are relative to the crop circle. */
export function movePhotoCrop(
  width: number,
  height: number,
  crop: PhotoCrop,
  start: CropPoint,
  end: CropPoint,
  ratio = 1,
): PhotoCrop {
  const before = cropRectangle(width, height, crop);
  const zoom = Math.max(1, Math.min(3, crop.zoom * ratio));
  const edge = Math.min(width, height) / zoom;
  const x = before.x + start.x * before.edge - end.x * edge;
  const y = before.y + start.y * before.edge - end.y * edge;
  return {
    zoom,
    x: Math.max(0, Math.min(1, x / (width - edge || Infinity))),
    y: Math.max(0, Math.min(1, y / (height - edge || Infinity))),
  };
}

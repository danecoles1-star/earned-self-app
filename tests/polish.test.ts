import { describe, expect, it } from "vitest";
import { cropRectangle, movePhotoCrop } from "../src/data/photoCrop";
import { isAppRoute } from "../src/data/routes";
describe("photo framing", () => {
  it("allows a portrait crop to reach the top and bottom without empty pixels", () => {
    expect(cropRectangle(600, 1200, { x: 0.5, y: 0, zoom: 1 })).toEqual({
      x: 0,
      y: 0,
      edge: 600,
    });
    expect(cropRectangle(600, 1200, { x: 0.5, y: 1, zoom: 1 })).toEqual({
      x: 0,
      y: 600,
      edge: 600,
    });
  });
  it("allows landscape positioning and zoom while clamping to the image", () => {
    expect(cropRectangle(1200, 600, { x: 1, y: 0.5, zoom: 2 })).toEqual({
      x: 900,
      y: 150,
      edge: 300,
    });
    expect(cropRectangle(1200, 600, { x: 9, y: -1, zoom: 20 })).toEqual({
      x: 1000,
      y: 0,
      edge: 200,
    });
  });
});
describe("route boundaries", () => {
  it("keeps auth, recovery, resume and current planning routes available", () => {
    for (const path of [
      "/auth/callback",
      "/manage/why",
      "/resume/g",
      "/revise/g/c",
      "/milestone/g",
      "/decision/g",
      "/proof/challenge/g",
      "/wallpaper/g",
      "/settings",
      "/start",
    ])
      expect(isAppRoute(path)).toBe(true);
  });
  it("rejects arbitrary addresses and extra route segments", () => {
    for (const path of [
      "/random",
      "/manage-typo",
      "/manage/why/extra",
      "/report/id/extra",
      "/history",
    ])
      expect(isAppRoute(path)).toBe(false);
  });
});

it("pinch zoom preserves the image point under the gesture center", () => {
  const next = movePhotoCrop(
    1200,
    800,
    { x: 0.5, y: 0.5, zoom: 1 },
    { x: 0.5, y: 0.5 },
    { x: 0.5, y: 0.5 },
    2,
  );
  const rect = cropRectangle(1200, 800, next);
  expect(next.zoom).toBe(2);
  expect(rect.x + rect.edge / 2).toBe(600);
  expect(rect.y + rect.edge / 2).toBe(400);
});
it("one-finger panning keeps zoom and clamps to image boundaries", () => {
  const next = movePhotoCrop(
    1200,
    800,
    { x: 0.5, y: 0.5, zoom: 2 },
    { x: 0.5, y: 0.5 },
    { x: 0.7, y: 0.6 },
  );
  expect(next.zoom).toBe(2);
  expect(cropRectangle(1200, 800, next)).toEqual({ edge: 400, x: 320, y: 160 });
  expect(
    movePhotoCrop(
      800,
      800,
      { x: 0.5, y: 0.5, zoom: 1 },
      { x: 0.5, y: 0.5 },
      { x: 2, y: 2 },
      0.2,
    ),
  ).toEqual({ zoom: 1, x: 0, y: 0 });
});

import { expect, it } from "vitest";
import { exampleArtwork } from "../src/experience/exampleArtwork";
it("maps each known challenge to relevant curated artwork without classifying arbitrary members", () => {
  expect(exampleArtwork("Launch my ceramics business.")).toContain("illo-ceramics");
  expect(exampleArtwork("Complete my first triathlon.")).toContain("area-physical");
  expect(exampleArtwork("Deliver a keynote at an industry conference.")).toContain("how-after-speech");
  expect(exampleArtwork("Finish my novella and share it with three readers.")).toContain("area-personal");
  expect(exampleArtwork("Learn pottery for fun")).toBeUndefined();
});

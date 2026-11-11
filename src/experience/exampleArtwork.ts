import ceramics from "../assets/illustrations/illo-ceramics.webp";
import triathlon from "../assets/workshop/area-physical.webp";
import keynote from "../assets/workshop/how-after-speech.webp";
import novella from "../assets/workshop/area-personal.webp";

// Exact curated examples only; do not infer a member's category or identity.
// Saved prepared-step imagery continues to take priority in MemberHome.
export function exampleArtwork(words: string): string | undefined {
  const key = words
    .trim()
    .toLowerCase()
    .replace(/[.!?]+$/, "");
  return (
    {
      "launch my ceramics business": ceramics,
      "complete my first triathlon": triathlon,
      "deliver a keynote at an industry conference": keynote,
      "finish my novella and share it with three readers": novella,
    } as Record<string, string>
  )[key];
}

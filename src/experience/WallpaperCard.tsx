import type { Goal } from "../data/types";
import { artFor } from "./workshopArt";
export function WallpaperCard({
  goal,
  navigate,
}: {
  goal: Goal;
  navigate: (path: string) => void;
}) {
  return (
    <button
      className="wallpaper-card"
      aria-label="Create wallpaper"
      onClick={() => navigate("/wallpaper/" + goal.id)}
    >
      <span className="wallpaper-miniature" aria-hidden="true">
        <img src={artFor(goal.area)} alt="" />
        <span>{goal.vision}</span>
      </span>
      <span>
        <strong>Take your vision with you</strong>
        <small>Create wallpaper →</small>
      </span>
    </button>
  );
}

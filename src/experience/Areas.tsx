import { createContext, useContext, type ReactNode } from "react";
import type { GrowthArea, Goal } from "../data/types";
export const areas: GrowthArea[] = ["physical", "professional", "personal"];
export const areaLabel = (area: GrowthArea) =>
  area[0].toUpperCase() + area.slice(1);
export const AreaContext = createContext<{
  area: GrowthArea | null;
  choose: (a: GrowthArea) => void;
  goals: Goal[];
  busy: boolean;
  assignment?: ReactNode;
}>({ area: null, choose: () => {}, goals: [], busy: false });
export function AreaTabs() {
  const { area, choose, busy } = useContext(AreaContext);
  return (
    <>
      <nav className="area-tabs" aria-label="Area of growth">
        {areas.map((a) => (
          <button
            key={a}
            disabled={busy}
            aria-pressed={area === a}
            onClick={() => choose(a)}
          >
            {areaLabel(a)}
          </button>
        ))}
      </nav>
    </>
  );
}

export function AreaAssignment() {
  const { assignment } = useContext(AreaContext);
  return <>{assignment}</>;
}

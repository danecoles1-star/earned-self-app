import type { GrowthArea } from "../data/types";
import physical from "../assets/workshop/area-physical.webp";
import professional from "../assets/workshop/area-professional.webp";
import personal from "../assets/workshop/area-personal.webp";
import proofPhysical from "../assets/workshop/proof-physical.webp";
import proofProfessional from "../assets/workshop/proof-professional.webp";
import proofPersonal from "../assets/workshop/proof-personal.webp";
import doors from "../assets/workshop/plan-doors.webp";
export const areaArt = { physical, professional, personal };
export const proofArt = {
  physical: proofPhysical,
  professional: proofProfessional,
  personal: proofPersonal,
};
export function artFor(area: GrowthArea | null | undefined, completed = false) {
  return area ? (completed ? proofArt : areaArt)[area] : doors;
}

import preparePhysical from "../assets/workshop/prepare-physical.webp";
import prepareProfessional from "../assets/workshop/prepare-professional.webp";
import preparePersonal from "../assets/workshop/prepare-personal.webp";
export const preparationArt = {
  physical: preparePhysical,
  professional: prepareProfessional,
  personal: preparePersonal,
};

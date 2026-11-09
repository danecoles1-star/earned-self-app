import { emptyFoundation } from "../src/data/types";
export const mid = "11111111-1111-4111-8111-111111111111";
export const foundation = {
  ...emptyFoundation(),
  words: "Launch my ceramics business.",
  vision: "Become a working maker.",
  outcome: "Three paid orders fulfilled.",
  meaning: "I have postponed this for years.",
  constraints: "Keep my job.",
  capabilities: "Cost production.",
  unknowns: "Repeat demand.",
  affirmed: true,
  milestones: [
    {
      id: mid,
      title: "Validate collection",
      criterion: "Cost six pieces",
      localDate: "2030-12-01",
      localTime: "17:00",
      timeZone: "America/Denver",
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Launch shop",
      criterion: "Publish shop",
      localDate: "2030-12-15",
      localTime: "17:00",
      timeZone: "America/Denver",
    },
  ],
};
export const action = {
  id: "c",
  goalId: "g",
  milestoneId: mid,
  action: "Cost the collection",
  criterion: "Six costs saved",
  localDate: "2030-10-01",
  localTime: "12:00",
  timeZone: "America/Denver",
  decision: "continue",
};

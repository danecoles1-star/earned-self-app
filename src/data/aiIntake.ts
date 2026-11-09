/** Draft-only intake. Never an authoritative service request or a saved plan. */
export interface AIIntake {
  version: 1;
  page: number;
  interests: string;
  startingAbility: string;
  weeklyMinutes: string;
  resources: string;
  limitations: string;
  timezone: string;
  locale: string;
}
export interface AIProfile {
  desired_growth: string;
  interests: string[];
  starting_ability: string;
  weekly_minutes: number;
  resources: string[];
  limitations: string[];
  locale: string;
  timezone: string;
}
export const newAIIntake = (): AIIntake => ({
  version: 1,
  page: 0,
  interests: "",
  startingAbility: "",
  weeklyMinutes: "",
  resources: "",
  limitations: "",
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "",
  locale: navigator.language || "en-US",
});
const lines = (value: string) =>
  value
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
export function validWeeklyMinutes(value: string): boolean {
  return (
    /^\d+$/.test(value.trim()) && Number(value) >= 1 && Number(value) <= 10080
  );
}
export function validTimezone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return !!value.trim();
  } catch {
    return false;
  }
}
/** Exact wire-2 profile names, ready for a server-side adapter after validation. */
export function intakeProfile(
  intake: AIIntake,
  desiredGrowth: string,
): AIProfile {
  if (
    !desiredGrowth.trim() ||
    !intake.startingAbility.trim() ||
    !intake.interests.trim() ||
    !intake.resources.trim() ||
    !intake.limitations.trim() ||
    !validWeeklyMinutes(intake.weeklyMinutes) ||
    !validTimezone(intake.timezone) ||
    !intake.locale.trim() ||
    [intake.interests, intake.resources, intake.limitations].some(
      (value) => lines(value).length > 200,
    ) ||
    [
      desiredGrowth,
      intake.startingAbility,
      intake.locale,
      intake.timezone,
    ].some((value) => value.trim().length > 12000)
  )
    throw new Error("Complete your starting point before continuing.");
  return {
    desired_growth: desiredGrowth.trim(),
    interests: lines(intake.interests),
    starting_ability: intake.startingAbility.trim(),
    weekly_minutes: Number(intake.weeklyMinutes),
    resources: lines(intake.resources),
    limitations: lines(intake.limitations),
    locale: intake.locale,
    timezone: intake.timezone.trim(),
  };
}
export function aiIntakeEnabled(
  flag: string | undefined,
  projectUrl: string | undefined,
): boolean {
  return (
    flag === "true" && projectUrl === "https://sujfjefijybvywchibbk.supabase.co"
  );
}

import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { cardState } from "../src/experience/MemberHome";
import {
  NowCard,
  friendlyWhen,
  preparedStep,
  totalMinutes,
} from "../src/experience/NowCard";
import { emptySnapshot } from "../src/data/types";

const now = new Date(2026, 10, 10, 9, 0);

it("Now card state follows the saved schedule and always offers Begin", () => {
  const at = (d: Date) => d.toISOString();
  expect(cardState(null, null, null, false, now)).toMatchObject({
    state: "unscheduled",
    action: "Prepare",
  });
  expect(
    cardState(at(new Date(2026, 10, 10, 9, 30)), null, null, true, now),
  ).toMatchObject({
    state: "ready",
    tag: "Ready now",
    action: "Begin",
  });
  const later = cardState(
    at(new Date(2026, 10, 10, 22, 0)),
    null,
    null,
    true,
    now,
  );
  expect(later.state).toBe("later");
  expect(later.tag).toMatch(/^Starts /);
  expect(later.action).toBe("Begin");
  expect(
    cardState(at(new Date(2026, 10, 14, 7, 0)), null, null, true, now).tag,
  ).toBe("Coming up");
  const missed = cardState(
    at(new Date(2026, 10, 9, 6, 30)),
    null,
    null,
    true,
    now,
  );
  expect(missed.state).toBe("missed");
  expect(missed.tag).toMatch(/^Still yours · from /);
  expect(missed.action).toBe("Begin");
  // Falls back to the local date and time when no instant is saved.
  expect(cardState(null, "2026-11-09", "06:30", true, now).state).toBe(
    "missed",
  );
});

it("friendly times read as people say them", () => {
  expect(
    friendlyWhen(new Date(2026, 10, 10, 6, 30).toISOString(), now),
  ).toMatch(/^Today · /);
  expect(
    friendlyWhen(new Date(2026, 10, 10, 22, 0).toISOString(), now),
  ).toMatch(/^Tonight · /);
  expect(friendlyWhen(new Date(2026, 10, 11, 7, 0).toISOString(), now)).toMatch(
    /^Tomorrow · /,
  );
  expect(friendlyWhen(null, now)).toBe("");
});

it("prepared steps only apply to their own step revision and drop unsafe data", () => {
  const s = {
    ...emptySnapshot(),
    prepared: [
      {
        commitment_id: "c",
        commitment_revision: 2,
        image_url: "//evil.example/x.png",
        image_alt: null,
        parts: [
          { label: "Warm up", minutes: 5 },
          { label: "", minutes: 3 },
          { label: "Main", minutes: 0 },
          { label: "Flow", minutes: 12 },
        ],
      },
    ],
  };
  expect(preparedStep(s, "c", 1)).toBeNull();
  const p = preparedStep(s, "c", 2)!;
  expect(p.image_url).toBeNull();
  expect(p.parts.map((x) => x.label)).toEqual(["Warm up", "Flow"]);
  expect(totalMinutes(p.parts)).toBe(17);
});

it("the card shows its parts and one labelled action", () => {
  render(
    <NowCard
      state="ready"
      image="/x.webp"
      tag="Ready now · prepared for you"
      title="Evening stretch"
      parts={[{ label: "Warm up", minutes: 3 }]}
      action="Begin"
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Evening stretch" }),
  ).toBeVisible();
  expect(screen.getByRole("list", { name: "Session parts" })).toHaveTextContent(
    "Warm up · 3 min",
  );
  expect(screen.getByRole("button", { name: "Begin" })).toBeVisible();
});

it("prepared parts reject non-finite durations", () => {
  const s = {
    ...emptySnapshot(),
    prepared: [
      {
        commitment_id: "c",
        commitment_revision: 1,
        image_url: null,
        image_alt: null,
        parts: [
          { label: "Invalid", minutes: Infinity },
          { label: "Valid", minutes: 2 },
        ],
      },
    ],
  };
  expect(preparedStep(s, "c", 1)?.parts).toEqual([
    { label: "Valid", minutes: 2 },
  ]);
});

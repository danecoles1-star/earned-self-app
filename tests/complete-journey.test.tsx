import { beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Homepage } from "../src/components/Homepage";
import { Onboarding, newEntryExperience } from "../src/experience/Onboarding";
import { StepTimer } from "../src/experience/StepTimer";
import { emptyFoundation } from "../src/data/types";
beforeEach(() => {
  cleanup();
  localStorage.clear();
});
it("public examples switch without creating or selecting a user's challenge", () => {
  const start = vi.fn(),
    signIn = vi.fn();
  render(<Homepage start={start} signIn={signIn} signedIn={false} />);
  expect(screen.getByRole("heading", { name: "Become You." })).toBeVisible();
  expect(screen.getByText("Complete my first triathlon.")).toBeVisible();
  fireEvent.click(
    screen.getAllByRole("button", { name: "Professional", exact: true })[0],
  );
  expect(
    screen.getByText("Deliver a keynote at an industry conference."),
  ).toBeVisible();
  expect(screen.queryByText("Complete my first triathlon.")).toBeNull();
  fireEvent.click(
    screen.getAllByRole("button", { name: "Personal", exact: true })[0],
  );
  expect(
    screen.getByText("Finish my novella and share it with three readers."),
  ).toBeVisible();
  expect(start).not.toHaveBeenCalled();
  for (const button of screen.getAllByRole("button", {
    name: "Build my challenge",
    exact: true,
  }))
    fireEvent.click(button);
  fireEvent.click(screen.getByRole("button", { name: "Take your first step" }));
  expect(
    screen.queryByRole("button", { name: "Begin my challenge" }),
  ).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Make it mine" }));
  expect(start.mock.calls).toEqual(Array.from({ length: 4 }, () => ["vision"]));
  fireEvent.click(screen.getByRole("button", { name: "Log in" }));
  expect(signIn).toHaveBeenCalledOnce();
});
it("returning members have a direct Basecamp entry", () => {
  const signIn = vi.fn();
  render(<Homepage start={vi.fn()} signIn={signIn} signedIn />);
  fireEvent.click(screen.getByRole("button", { name: "Return to Now" }));
  expect(signIn).toHaveBeenCalledOnce();
});
it("first-action stage carries the authored title into the timer without changing the answer", () => {
  const x = newEntryExperience();
  x.step = 8;
  x.first.action = "Write my opening sentence";
  x.first.criterion = "One sentence saved";
  render(
    <Onboarding
      draft={{
        ...emptyFoundation(),
        id: "d",
        operationId: "o",
        boundOwner: null,
        experience: x,
      }}
      change={vi.fn()}
      signedIn={false}
      saving={false}
      error=""
      onFinish={vi.fn()}
      back={vi.fn()}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "Write my opening sentence" }),
  ).toBeVisible();
  expect(document.querySelector(".timer-action-name")).toHaveTextContent(
    "Write my opening sentence",
  );
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("00:00");
  expect(screen.getByText("Dedicated time")).toBeVisible();
});
it("only the marker is animated; time and schedule remain in the stationary readout", () => {
  render(
    <StepTimer
      identity="ring-check"
      title="A preparation step"
      schedule="10/06/2026 · 6:30 PM"
    />,
  );
  expect(document.querySelector(".timer-readout")).toContainElement(
    screen.getByLabelText("Elapsed time"),
  );
  expect(document.querySelector(".timer-readout")).toHaveTextContent(
    "10/06/2026 · 6:30 PM",
  );
  expect(document.querySelector(".timer-orbit")).not.toContainElement(
    screen.getByLabelText("Elapsed time"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
  expect(document.querySelector(".step-timer")).toHaveAttribute(
    "data-running",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Pause timer" }));
  expect(document.querySelector(".step-timer")).toHaveAttribute(
    "data-running",
    "false",
  );
});

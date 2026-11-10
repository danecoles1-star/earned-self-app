import { afterEach, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react";
import { StepTimer } from "../src/experience/StepTimer";
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.useRealTimers();
});
it("tracks part boundaries, pause and reload without claiming completed work", () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-11-10T09:00:00Z"));
  const parts = [
    { label: "Stretch", minutes: 1 },
    { label: "Stretch", minutes: 2 },
  ];
  const view = render(<StepTimer identity="parts" parts={parts} />);
  fireEvent.click(screen.getByRole("button", { name: "Start timer" }));
  act(() => vi.advanceTimersByTime(60000));
  expect(screen.getByText("Stretch · 2 min left")).toBeVisible();
  const items = screen.getAllByRole("listitem");
  expect(items[0]).not.toHaveAttribute("aria-current");
  expect(items[1]).toHaveAttribute("aria-current", "step");
  fireEvent.click(screen.getByRole("button", { name: "Pause timer" }));
  act(() => vi.advanceTimersByTime(60000));
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("01:00");
  view.unmount();
  render(<StepTimer identity="parts" parts={parts} />);
  expect(screen.getByLabelText("Elapsed time")).toHaveTextContent("01:00");
  fireEvent.click(screen.getByRole("button", { name: "Resume timer" }));
  act(() => vi.advanceTimersByTime(120000));
  expect(screen.getByText("Planned time reached")).toBeVisible();
  expect(document.querySelector('[aria-current="step"]')).toBeNull();
});

import { beforeEach, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Auth } from "../src/experience/Auth";
import { emptySnapshot, type Adapter } from "../src/data/types";
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
function setup() {
  const adapter: Adapter = {
    preview: false,
    configured: true,
    getUser: vi.fn(async () => null),
    subscribe: () => () => {},
    signIn: vi.fn(async () => {}),
    signOut: vi.fn(async () => {}),
    passwordSignIn: vi.fn(async () => {}),
    signUp: vi.fn(async () => {}),
    verifyCode: vi.fn(async () => {}),
    resendSignup: vi.fn(async () => {}),
    recoverPassword: vi.fn(async () => {}),
    updatePassword: vi.fn(async () => {}),
    read: async () => emptySnapshot(),
    execute: vi.fn(),
  };
  const done = vi.fn();
  render(<Auth adapter={adapter} user={null} onContinue={done} />);
  return { adapter, done, u: userEvent.setup() };
}
it("logs in inside the app and keeps invalid credentials on the form", async () => {
  const { adapter, done, u } = setup();
  vi.mocked(adapter.passwordSignIn!).mockRejectedValueOnce(
    new Error("Email or password is incorrect."),
  );
  await u.type(
    screen.getByLabelText("Email address"),
    "member@example.invalid",
  );
  await u.type(screen.getByLabelText("Password"), "synthetic-password");
  await u.click(screen.getByRole("button", { name: "Log in", exact: true }));
  expect(await screen.findByRole("alert")).toHaveTextContent("incorrect");
  expect(done).not.toHaveBeenCalled();
  await u.click(screen.getByRole("button", { name: "Log in", exact: true }));
  expect(done).toHaveBeenCalledOnce();
  expect(sessionStorage.length).toBe(0);
});
it("requires matching signup passwords, confirms with a code, and throttles resend", async () => {
  const { adapter, done, u } = setup();
  await u.click(screen.getByRole("button", { name: "Create an account" }));
  await u.type(
    screen.getByLabelText("Email address"),
    "member@example.invalid",
  );
  await u.type(screen.getByLabelText("New password"), "synthetic-password");
  expect(
    screen.getByRole("button", { name: "Create account", exact: true }),
  ).toBeDisabled();
  await u.type(screen.getByLabelText("Confirm password"), "synthetic-password");
  await u.click(
    screen.getByRole("button", { name: "Create account", exact: true }),
  );
  expect(await screen.findByLabelText("Verification code")).toHaveAttribute(
    "autocomplete",
    "one-time-code",
  );
  expect(screen.getByRole("button", { name: /Resend in/ })).toBeDisabled();
  expect(JSON.stringify(sessionStorage)).not.toContain("synthetic-password");
  vi.mocked(adapter.verifyCode!).mockRejectedValueOnce(
    new Error("Code expired."),
  );
  await u.type(screen.getByLabelText("Verification code"), "12345678");
  await u.click(screen.getByRole("button", { name: "Verify code" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("expired");
  expect(done).not.toHaveBeenCalled();
  await u.click(screen.getByRole("button", { name: "Verify code" }));
  expect(adapter.verifyCode).toHaveBeenLastCalledWith(
    "member@example.invalid",
    "12345678",
    "signup",
  );
  expect(done).toHaveBeenCalledOnce();
  expect(sessionStorage.length).toBe(0);
});
it("verifies recovery before accepting a new password and resumes after update", async () => {
  const { adapter, done, u } = setup();
  await u.click(screen.getByRole("button", { name: "Forgot password?" }));
  await u.type(
    screen.getByLabelText("Email address"),
    "member@example.invalid",
  );
  await u.click(screen.getByRole("button", { name: "Send code" }));
  await u.type(await screen.findByLabelText("Verification code"), "12345678");
  vi.mocked(adapter.getUser).mockResolvedValue({ id: "a" });
  await u.click(screen.getByRole("button", { name: "Verify code" }));
  expect(adapter.verifyCode).toHaveBeenCalledWith(
    "member@example.invalid",
    "12345678",
    "recovery",
  );
  expect(done).not.toHaveBeenCalled();
  vi.mocked(adapter.getUser).mockResolvedValue({ id: "a" });
  await u.type(
    await screen.findByLabelText("New password"),
    "new-synthetic-password",
  );
  await u.type(
    screen.getByLabelText("Confirm password"),
    "new-synthetic-password",
  );
  await u.click(
    screen.getByRole("button", { name: "Save password and continue" }),
  );
  expect(adapter.updatePassword).toHaveBeenCalledWith("new-synthetic-password");
  expect(done).toHaveBeenCalledOnce();
});

it("blocks a recovery password update after the account changes", async () => {
  sessionStorage.setItem(
    "earned-self:auth-request:v1",
    JSON.stringify({
      email: "member@example.invalid",
      type: "recovery",
      at: Date.now(),
      verifiedOwner: "a",
    }),
  );
  const adapter: Adapter = {
    configured: true,
    preview: false,
    getUser: vi.fn(async () => ({ id: "b" })),
    subscribe: () => () => {},
    signIn: vi.fn(),
    signOut: vi.fn(),
    read: vi.fn(),
    execute: vi.fn(),
    updatePassword: vi.fn(),
  };
  const done = vi.fn();
  render(<Auth adapter={adapter} user={{ id: "a" }} onContinue={done} />);
  const u = userEvent.setup();
  await u.type(screen.getByLabelText("New password"), "synthetic-password");
  await u.type(screen.getByLabelText("Confirm password"), "synthetic-password");
  await u.click(
    screen.getByRole("button", { name: "Save password and continue" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("session ended");
  expect(adapter.updatePassword).not.toHaveBeenCalled();
  expect(done).not.toHaveBeenCalled();
});

it("switches repeated signup to member OTP, preserving email and draft with the correct verification type", async () => {
  sessionStorage.setItem(
    "earned-self:auth-request:v1",
    JSON.stringify({
      email: "member@example.invalid",
      type: "signup",
      at: Date.now(),
    }),
  );
  localStorage.setItem("draft-check", "my unfinished plan");
  const { adapter, done, u } = setup();
  expect(screen.queryByText(/Enter the code sent to/)).not.toBeInTheDocument();
  await u.click(
    screen.getByRole("button", { name: "Sign in with an email code" }),
  );
  expect(screen.getByLabelText("Email address")).toHaveValue(
    "member@example.invalid",
  );
  expect(sessionStorage.getItem("earned-self:auth-request:v1")).toBeNull();
  expect(adapter.signIn).not.toHaveBeenCalled();
  await u.click(screen.getByRole("button", { name: "Send code" }));
  expect(adapter.signIn).toHaveBeenCalledWith("member@example.invalid");
  expect(adapter.resendSignup).not.toHaveBeenCalled();
  expect(
    JSON.parse(sessionStorage.getItem("earned-self:auth-request:v1")!).type,
  ).toBe("email");
  await u.type(screen.getByLabelText("Verification code"), "12345678");
  vi.mocked(adapter.getUser).mockResolvedValue({ id: "member" });
  await u.click(screen.getByRole("button", { name: "Verify code" }));
  expect(adapter.verifyCode).toHaveBeenCalledWith(
    "member@example.invalid",
    "12345678",
    "email",
  );
  await u.click(
    await screen.findByRole("button", { name: "Continue without a password" }),
  );
  expect(done).toHaveBeenCalledOnce();
  expect(localStorage.getItem("draft-check")).toBe("my unfinished plan");
});
it("keeps failed code requests on the form without restoring abandoned signup state", async () => {
  sessionStorage.setItem(
    "earned-self:auth-request:v1",
    JSON.stringify({
      email: "member@example.invalid",
      type: "signup",
      at: Date.now(),
    }),
  );
  const { adapter, done, u } = setup();
  await u.click(
    screen.getByRole("button", { name: "Sign in with an email code" }),
  );
  vi.mocked(adapter.signIn).mockRejectedValueOnce(
    new Error("Email sending is temporarily limited."),
  );
  await u.click(screen.getByRole("button", { name: "Send code" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "temporarily limited",
  );
  expect(screen.queryByLabelText("Verification code")).not.toBeInTheDocument();
  expect(sessionStorage.getItem("earned-self:auth-request:v1")).toBeNull();
  expect(done).not.toHaveBeenCalled();
});
it("retains recovery state after password-update failure and continues only after successful retry", async () => {
  const { adapter, done, u } = setup();
  await u.click(screen.getByRole("button", { name: "Forgot password?" }));
  await u.type(
    screen.getByLabelText("Email address"),
    "member@example.invalid",
  );
  await u.click(screen.getByRole("button", { name: "Send code" }));
  vi.mocked(adapter.getUser).mockResolvedValue({ id: "member" });
  await u.type(await screen.findByLabelText("Verification code"), "12345678");
  await u.click(screen.getByRole("button", { name: "Verify code" }));
  expect(
    screen.queryByRole("button", { name: "Continue without a password" }),
  ).not.toBeInTheDocument();
  await u.type(
    await screen.findByLabelText("New password"),
    "new-synthetic-password",
  );
  await u.type(
    screen.getByLabelText("Confirm password"),
    "new-synthetic-password",
  );
  vi.mocked(adapter.updatePassword!).mockRejectedValueOnce(
    new Error("Please try again."),
  );
  await u.click(
    screen.getByRole("button", { name: "Save password and continue" }),
  );
  expect(await screen.findByRole("alert")).toHaveTextContent("try again");
  expect(done).not.toHaveBeenCalled();
  expect(JSON.stringify(sessionStorage)).not.toContain(
    "new-synthetic-password",
  );
  await u.click(
    screen.getByRole("button", { name: "Save password and continue" }),
  );
  expect(done).toHaveBeenCalledOnce();
});

import { afterEach, it, expect, vi } from "vitest";
const mock = vi.hoisted(() => ({
  rpc: vi.fn(),
  getSession: vi.fn(),
  signInWithOtp: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChange: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    rpc: mock.rpc,
    auth: {
      getSession: mock.getSession,
      signInWithOtp: mock.signInWithOtp,
      signOut: mock.signOut,
      onAuthStateChange: mock.onAuthStateChange,
    },
  })),
}));
import { createSupabaseAdapter } from "../src/data/supabase";
import { createClient } from "@supabase/supabase-js";
function configured() {
  vi.stubEnv("VITE_SUPABASE_URL", "https://development-test.supabase.co");
  vi.stubEnv(
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "sb_publishable_test-placeholder",
  );
  return createSupabaseAdapter();
}
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("fails closed without configured service", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
  const a = createSupabaseAdapter();
  expect(a.configured).toBe(false);
  expect(await a.getUser()).toBeNull();
  await expect(a.read()).rejects.toThrow("not connected");
  expect(createClient).not.toHaveBeenCalled();
});
it("uses PKCE and an exact same-origin email callback", async () => {
  const a = configured();
  mock.signInWithOtp.mockResolvedValue({ error: null });
  await a.signIn("tester@example.invalid");
  expect(mock.signInWithOtp).toHaveBeenCalledWith({
    email: "tester@example.invalid",
    options: {
      emailRedirectTo: location.origin + "/auth/callback",
      shouldCreateUser: true,
    },
  });
  expect(createClient).toHaveBeenCalledWith(
    expect.any(String),
    expect.any(String),
    {
      auth: {
        flowType: "pkce",
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );
});
it("sends only the atomic command with captured owner and stable operation id", async () => {
  const a = configured();
  mock.rpc.mockResolvedValue({
    data: { id: "resource", version: 1 },
    error: null,
  });
  const c = {
    actorId: "original-account",
    operationId: "same-operation",
    kind: "goal" as const,
    payload: { id: "resource", words: "My own goal", kind: "goal" },
  };
  await a.execute(c);
  await a.execute(c);
  expect(mock.rpc).toHaveBeenCalledTimes(2);
  expect(mock.rpc).toHaveBeenLastCalledWith("es_command", {
    p_expected_owner: c.actorId,
    p_operation: c.operationId,
    p_kind: c.kind,
    p_payload: c.payload,
  });
});
it("rejects failed writes instead of returning false success", async () => {
  const a = configured();
  mock.rpc.mockResolvedValue({
    data: null,
    error: { code: "network", message: "internal connection text" },
  });
  await expect(
    a.execute({
      actorId: "a",
      operationId: "op",
      kind: "select",
      payload: { goalId: "g" },
    }),
  ).rejects.toThrow("not confirmed");
});
it("uses only member state RPC for reads", async () => {
  const a = configured();
  mock.rpc.mockResolvedValue({ data: { goals: [] }, error: null });
  await a.read();
  expect(mock.rpc).toHaveBeenCalledWith("es_read_state");
});
it("rejects secret credentials and unsafe endpoint origins", () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://development-test.supabase.co");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "not-a-publishable-key");
  expect(() => createSupabaseAdapter()).toThrow(/publishable/);
  vi.stubEnv("VITE_SUPABASE_URL", "https://untrusted.example");
  vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  expect(() => createSupabaseAdapter()).toThrow();
});

import { createClient } from "@supabase/supabase-js";
import type { Adapter, Snapshot, Receipt } from "./types";
export function createSupabaseAdapter(): Adapter {
  const url = import.meta.env.VITE_SUPABASE_URL,
    key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const configured = !!url && !!key;
  // Only publishable keys are accepted in this frontend. No service credentials or legacy JWTs.
  if (
    configured &&
    (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(url) ||
      !key.startsWith("sb_publishable_"))
  )
    throw new Error("Use the development Supabase URL and publishable key.");
  const client = configured
    ? createClient(url, key, {
        auth: {
          flowType: "pkce",
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;
  const requireClient = () => {
    if (!client)
      throw new Error(
        "Account saving is not connected yet. Your draft stays on this device.",
      );
    return client;
  };
  return {
    preview: false,
    configured,
    async getUser() {
      if (!client) return null;
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      return data.session?.user ?? null;
    },
    subscribe(cb) {
      if (!client) return () => {};
      const { data } = client.auth.onAuthStateChange((_event, session) =>
        cb(session?.user ?? null),
      );
      return () => data.subscription.unsubscribe();
    },
    async signIn(email) {
      const { error } = await requireClient().auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: location.origin + "/auth/callback",
          shouldCreateUser: true,
        },
      });
      if (error)
        throw new Error(
          "The sign-in email could not be sent. Check the address and try again shortly.",
        );
    },
    async signOut() {
      const { error } = await requireClient().auth.signOut({ scope: "local" });
      if (error) throw new Error("Sign-out did not finish. Try again.");
    },
    async read() {
      const { data, error } = await requireClient().rpc("es_read_state");
      if (error)
        throw new Error(
          "Your saved work could not be loaded. Retry without creating a new pursuit.",
        );
      return data as Snapshot;
    },
    async execute(c) {
      const { data, error } = await requireClient().rpc("es_command", {
        p_expected_owner: c.actorId,
        p_operation: c.operationId,
        p_kind: c.kind,
        p_payload: c.payload,
      });
      if (error) {
        if (error.code === "P0001") throw new Error(error.message);
        throw new Error(
          "This save was not confirmed. Your input is still here. Retry the same save.",
        );
      }
      return data as Receipt;
    },
  };
}

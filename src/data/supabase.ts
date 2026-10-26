import { authMessage } from "./authErrors";
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
    async getProfilePhoto() {
      const auth = await requireClient().auth.getUser();
      if (auth.error || !auth.data.user)
        throw new Error("Sign in to load your photo.");
      const { data, error } = await requireClient()
        .storage.from("profile-photos")
        .download(auth.data.user.id + "/avatar.webp");
      if (error) {
        if (/not found|does not exist/i.test(error.message)) return null;
        throw error;
      }
      return data;
    },
    async setProfilePhoto(photo) {
      const auth = await requireClient().auth.getUser();
      if (auth.error || !auth.data.user)
        throw new Error("Sign in to save your photo.");
      const path = auth.data.user.id + "/avatar.webp";
      const bucket = requireClient().storage.from("profile-photos");
      const result = photo
        ? await bucket.upload(path, photo, {
            upsert: true,
            contentType: photo.type,
            cacheControl: "0",
          })
        : await bucket.remove([path]);
      if (result.error) throw result.error;
    },
    async signIn(email) {
      const { error } = await requireClient().auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: location.origin + "/auth/callback",
          shouldCreateUser: false,
        },
      });
      if (error) throw new Error(authMessage(error));
    },
    async passwordSignIn(email, password) {
      const { error } = await requireClient().auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw new Error(authMessage(error));
    },
    async signUp(email, password) {
      const { error } = await requireClient().auth.signUp({ email, password });
      if (error) throw new Error(authMessage(error));
    },
    async verifyCode(email, token, type) {
      const { data, error } = await requireClient().auth.verifyOtp({
        email,
        token,
        type,
      });
      if (error) throw new Error(authMessage(error));
      if (!data.session)
        throw new Error(
          "Verification did not create a session. Please try again.",
        );
    },
    async resendSignup(email) {
      const { error } = await requireClient().auth.resend({
        type: "signup",
        email,
      });
      if (error) throw new Error(authMessage(error));
    },
    async recoverPassword(email) {
      const { error } = await requireClient().auth.resetPasswordForEmail(email);
      if (error) throw new Error(authMessage(error));
    },
    async updatePassword(password) {
      const { error } = await requireClient().auth.updateUser({ password });
      if (error) throw new Error(authMessage(error));
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

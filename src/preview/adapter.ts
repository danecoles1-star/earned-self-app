import { applyLocal, emptySnapshot, type LocalStore } from "../data/domain";
import type { Adapter, User, Command } from "../data/types";
const storeKey = "earned-self:LOCAL-PREVIEW-ONLY:personal:v1",
  sessionKey = "earned-self:LOCAL-PREVIEW-ONLY:session";
const user: User = { id: "local-preview-member", email: "Local preview" };
export function createPreviewAdapter(): Adapter {
  let fail = false;
  const listeners = new Set<(u: User | null) => void>();
  const read = (): LocalStore => {
    const raw = localStorage.getItem(storeKey);
    if (!raw) return { snapshot: emptySnapshot(), receipts: {} };
    try {
      return JSON.parse(raw);
    } catch {
      throw new Error(
        "Local preview data could not be read. It has not been overwritten.",
      );
    }
  };
  const check = () => {
    if (!localStorage.getItem(sessionKey))
      throw new Error("Enter local preview first.");
  };
  return {
    preview: true,
    configured: true,
    async getUser() {
      return localStorage.getItem(sessionKey) ? user : null;
    },
    subscribe(cb) {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    async signIn() {
      throw new Error("Preview does not send email.");
    },
    async enterPreview() {
      localStorage.setItem(sessionKey, "active");
      listeners.forEach((cb) => cb(user));
    },
    async signOut() {
      localStorage.removeItem(sessionKey);
      listeners.forEach((cb) => cb(null));
    },
    async read() {
      check();
      await new Promise((r) => setTimeout(r, 150));
      return read().snapshot;
    },
    async execute(command: Command) {
      check();
      await new Promise((r) => setTimeout(r, 200));
      if (fail) {
        fail = false;
        throw new Error(
          "Preview test: this save failed. Your input is still here. Try again.",
        );
      }
      const apply = () => {
        const result = applyLocal(read(), command, user.id);
        localStorage.setItem(storeKey, JSON.stringify(result.store));
        return result.receipt;
      };
      return navigator.locks
        ? navigator.locks.request(storeKey, apply)
        : apply();
    },
    failNext() {
      fail = true;
    },
  };
}

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Adapter } from "../data/types";
import account from "../assets/icons/user-round.svg";

type Profile = {
  photo: string | null;
  busy: boolean;
  error: string;
  save: (blob: Blob | null) => Promise<void>;
};
export const ProfileContext = createContext<Profile>({
  photo: null,
  busy: false,
  error: "",
  save: async () => {},
});
export function ProfileProvider({
  adapter,
  owner,
  children,
}: {
  adapter: Adapter;
  owner: string | null;
  children: ReactNode;
}) {
  const [photo, setPhoto] = useState<string | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const url = useRef<string | null>(null),
    generation = useRef(0);
  const replace = (blob: Blob | null) => {
    if (url.current) URL.revokeObjectURL(url.current);
    url.current = blob ? URL.createObjectURL(blob) : null;
    setPhoto(url.current);
  };
  useEffect(() => {
    const token = ++generation.current;
    replace(null);
    setError("");
    if (owner && adapter.getProfilePhoto)
      void adapter
        .getProfilePhoto()
        .then((blob) => {
          if (generation.current === token) replace(blob);
        })
        .catch(() => {
          if (generation.current === token)
            setError(
              "Your photo could not load. You can try again from Account.",
            );
        });
    return () => {
      generation.current++;
      if (url.current) URL.revokeObjectURL(url.current);
    };
  }, [owner, adapter]);
  const save = async (blob: Blob | null) => {
    if (!owner || !adapter.setProfilePhoto)
      throw new Error("Photo saving is unavailable.");
    const token = generation.current;
    setBusy(true);
    setError("");
    try {
      await adapter.setProfilePhoto(blob);
      if (token === generation.current) replace(blob);
    } catch {
      if (token === generation.current)
        setError("Your photo could not be saved. Please try again.");
      throw new Error("Photo save failed.");
    } finally {
      if (token === generation.current) setBusy(false);
    }
  };
  return (
    <ProfileContext.Provider value={{ photo, busy, error, save }}>
      {children}
    </ProfileContext.Provider>
  );
}

/** Re-encode to a small square image, dropping original metadata before uploading. */
export async function prepareProfilePhoto(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp|heic|heif)$/.test(file.type))
    throw new Error(
      "Choose a JPG, PNG, WebP, or a photo your browser can open.",
    );
  if (file.size > 15 * 1024 * 1024)
    throw new Error("Choose a photo smaller than 15 MB.");
  const source = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = source;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 256;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Photo editing is unavailable in this browser.");
    const edge = Math.min(img.naturalWidth, img.naturalHeight);
    ctx.drawImage(
      img,
      (img.naturalWidth - edge) / 2,
      (img.naturalHeight - edge) / 2,
      edge,
      edge,
      0,
      0,
      256,
      256,
    );
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85),
    );
    if (!blob || blob.size > 262144)
      throw new Error(
        "This photo could not be prepared. Choose another photo.",
      );
    return blob;
  } catch (error) {
    throw error instanceof Error && !/decode/i.test(error.message)
      ? error
      : new Error("This photo format cannot be opened here. Try a JPG or PNG.");
  } finally {
    URL.revokeObjectURL(source);
  }
}
export function ProfilePhotoEditor() {
  const { photo, busy, error, save } = useContext(ProfileContext);
  const [draft, setDraft] = useState<Blob | null>(null),
    [preview, setPreview] = useState<string | null>(null),
    [notice, setNotice] = useState(""),
    [preparing, setPreparing] = useState(false);
  useEffect(() => {
    if (!draft) {
      setPreview(null);
      return;
    }
    const value = URL.createObjectURL(draft);
    setPreview(value);
    return () => URL.revokeObjectURL(value);
  }, [draft]);
  return (
    <section className="profile-editor" aria-label="Profile photo">
      <img
        className="profile-editor-image"
        src={preview || photo || account}
        alt="Profile photo preview"
      />
      <h2>Your photo</h2>
      <p className="small">
        Only you can see it. Preview the crop before saving.
      </p>
      <label className="button secondary photo-picker">
        {photo ? "Change photo" : "Upload photo"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          disabled={busy || preparing}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setPreparing(true);
            setNotice("");
            try {
              setDraft(await prepareProfilePhoto(file));
            } catch (err) {
              setNotice(
                err instanceof Error ? err.message : "Photo could not open.",
              );
            } finally {
              setPreparing(false);
            }
          }}
        />
      </label>
      {draft && (
        <div className="photo-actions">
          <button
            className="button"
            disabled={busy}
            onClick={async () => {
              try {
                await save(draft);
                setDraft(null);
                setNotice("Photo saved.");
              } catch {}
            }}
          >
            {busy ? "Saving…" : "Save photo"}
          </button>
          <button
            className="quiet"
            disabled={busy}
            onClick={() => setDraft(null)}
          >
            Cancel
          </button>
        </div>
      )}
      {photo && !draft && (
        <button
          className="quiet"
          disabled={busy}
          onClick={async () => {
            try {
              await save(null);
              setNotice("Photo removed.");
            } catch {}
          }}
        >
          Remove photo
        </button>
      )}
      {(error || notice || preparing) && (
        <p role="status">
          {error || (preparing ? "Preparing photo…" : notice)}
        </p>
      )}
    </section>
  );
}

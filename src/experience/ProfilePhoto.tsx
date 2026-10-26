import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  cropRectangle,
  movePhotoCrop,
  type CropPoint,
  type PhotoCrop,
} from "../data/photoCrop";
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
export async function prepareProfilePhoto(
  file: File,
  crop: PhotoCrop = { x: 0.5, y: 0.5, zoom: 1 },
): Promise<Blob> {
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
    const rect = cropRectangle(img.naturalWidth, img.naturalHeight, crop);
    ctx.drawImage(img, rect.x, rect.y, rect.edge, rect.edge, 0, 0, 256, 256);
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
  const [draft, setDraft] = useState<File | null>(null),
    [preview, setPreview] = useState<string | null>(null),
    [notice, setNotice] = useState(""),
    [preparing, setPreparing] = useState(false);
  const [crop, setCrop] = useState<PhotoCrop>({ x: 0.5, y: 0.5, zoom: 1 });
  const [dimensions, setDimensions] = useState({ width: 1, height: 1 });
  const pointers = useRef(new Map<number, CropPoint>());
  const currentCrop = useRef(crop);
  currentCrop.current = crop;
  const gesture = useRef<{
    center: CropPoint;
    distance: number;
    crop: PhotoCrop;
  } | null>(null);
  const resetGesture = () => {
    const points = [...pointers.current.values()];
    if (!points.length) {
      gesture.current = null;
      return;
    }
    const [a, b = a] = points;
    gesture.current = {
      center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 },
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      crop: currentCrop.current,
    };
  };
  const rect = cropRectangle(dimensions.width, dimensions.height, crop);
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
        src={photo || account}
        alt="Profile photo preview"
      />
      <h2>Your photo</h2>
      <p className="small">
        Only you can see it. Position your photo before saving.
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
              // Validate and decode before presenting positioning controls. Nothing uploads yet.
              await prepareProfilePhoto(file);
              const source = URL.createObjectURL(file);
              try {
                const image = new Image();
                image.src = source;
                await image.decode();
                setDimensions({
                  width: image.naturalWidth,
                  height: image.naturalHeight,
                });
                pointers.current.clear();
                gesture.current = null;
                setCrop({ x: 0.5, y: 0.5, zoom: 1 });
                setDraft(file);
              } finally {
                URL.revokeObjectURL(source);
              }
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
        <div className="photo-crop">
          <p>Drag to position. Pinch to zoom.</p>
          <div
            className="photo-crop-window"
            aria-label="Photo crop preview"
            onPointerDown={(e) => {
              if (busy || preparing || pointers.current.size >= 2) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              const bounds = e.currentTarget.getBoundingClientRect();
              pointers.current.set(e.pointerId, {
                x:
                  (e.clientX - bounds.left - bounds.width * 0.1) /
                  (bounds.width * 0.8),
                y:
                  (e.clientY - bounds.top - bounds.height * 0.1) /
                  (bounds.height * 0.8),
              });
              resetGesture();
            }}
            onPointerUp={(e) => {
              pointers.current.delete(e.pointerId);
              resetGesture();
            }}
            onPointerCancel={(e) => {
              pointers.current.delete(e.pointerId);
              resetGesture();
            }}
            onLostPointerCapture={(e) => {
              if (pointers.current.delete(e.pointerId)) resetGesture();
            }}
            onPointerMove={(e) => {
              if (
                !pointers.current.has(e.pointerId) ||
                !gesture.current ||
                busy ||
                preparing
              )
                return;
              const bounds = e.currentTarget.getBoundingClientRect();
              pointers.current.set(e.pointerId, {
                x:
                  (e.clientX - bounds.left - bounds.width * 0.1) /
                  (bounds.width * 0.8),
                y:
                  (e.clientY - bounds.top - bounds.height * 0.1) /
                  (bounds.height * 0.8),
              });
              const [a, b = a] = [...pointers.current.values()];
              const center = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
              const distance = Math.hypot(a.x - b.x, a.y - b.y);
              const start = gesture.current;
              const next = movePhotoCrop(
                dimensions.width,
                dimensions.height,
                start.crop,
                start.center,
                center,
                start.distance ? distance / start.distance : 1,
              );
              currentCrop.current = next;
              setCrop(next);
            }}
          >
            <img
              src={preview || undefined}
              alt="Positioned photo"
              draggable={false}
              style={{
                width: `${(dimensions.width / rect.edge) * 80}%`,
                height: `${(dimensions.height / rect.edge) * 80}%`,
                left: `${10 + (-rect.x / rect.edge) * 80}%`,
                top: `${10 + (-rect.y / rect.edge) * 80}%`,
              }}
            />
            <span className="photo-crop-frame" aria-hidden="true" />
          </div>
          <details className="photo-crop-adjust">
            <summary>Adjust</summary>
            <label>
              Zoom
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={crop.zoom}
                disabled={busy}
                onChange={(e) => setCrop({ ...crop, zoom: +e.target.value })}
              />
            </label>
            <label>
              Horizontal position
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={crop.x}
                disabled={busy}
                onChange={(e) => setCrop({ ...crop, x: +e.target.value })}
              />
            </label>
            <label>
              Vertical position
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={crop.y}
                disabled={busy}
                onChange={(e) => setCrop({ ...crop, y: +e.target.value })}
              />
            </label>
          </details>
          <div className="photo-actions">
            <button
              className="button"
              disabled={busy || preparing}
              onClick={async () => {
                setPreparing(true);
                try {
                  await save(await prepareProfilePhoto(draft, crop));
                  setDraft(null);
                  setNotice("Photo saved.");
                } catch (err) {
                  setNotice(
                    err instanceof Error
                      ? err.message
                      : "Photo could not be saved.",
                  );
                } finally {
                  setPreparing(false);
                }
              }}
            >
              {busy || preparing ? "Saving…" : "Save photo"}
            </button>
            <button
              className="quiet"
              disabled={busy || preparing}
              onClick={() => setDraft(null)}
            >
              Cancel
            </button>
          </div>
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

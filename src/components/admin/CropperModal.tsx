import { useCallback, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { X } from "lucide-react";

export type AspectKey = "16:9" | "1:1" | "3:4";

const ASPECT: Record<AspectKey, { aspect: number; outW: number; outH: number }> = {
  "16:9": { aspect: 16 / 9, outW: 1600, outH: 900 },
  "1:1": { aspect: 1, outW: 800, outH: 800 },
  "3:4": { aspect: 3 / 4, outW: 600, outH: 800 },
};

async function getCroppedDataUrl(src: string, area: Area, outW: number, outH: number): Promise<string> {
  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = src;
  });
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, area.x, area.y, area.width, area.height, 0, 0, outW, outH);
  return canvas.toDataURL("image/jpeg", 0.9);
}

export function CropperModal({
  src,
  aspectKey,
  onCancel,
  onSave,
}: {
  src: string;
  aspectKey: AspectKey;
  onCancel: () => void;
  onSave: (dataUrl: string) => void;
}) {
  const cfg = ASPECT[aspectKey];
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), []);

  async function save() {
    if (!area) return;
    setBusy(true);
    try {
      const dataUrl = await getCroppedDataUrl(src, area, cfg.outW, cfg.outH);
      onSave(dataUrl);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3" onClick={onCancel}>
      <div
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-slate-900 p-4"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-extrabold">برش تصویر ({aspectKey})</h3>
          <button onClick={onCancel} className="rounded-lg p-1 hover:bg-white/10">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-black">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={cfg.aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onComplete}
            objectFit="contain"
          />
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">زوم</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="flex-1 accent-sky-500"
          />
          <span className="w-10 text-center tabular-nums">{zoom.toFixed(1)}x</span>
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={onCancel} className="rounded-lg bg-white/5 px-4 py-2 text-xs hover:bg-white/10">
            انصراف
          </button>
          <button
            disabled={busy || !area}
            onClick={save}
            className="rounded-lg btn-primary-gradient px-4 py-2 text-xs font-extrabold disabled:opacity-50"
          >
            {busy ? "در حال ذخیره…" : "ذخیره برش"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result));
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

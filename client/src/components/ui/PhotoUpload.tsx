import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  current?: string | null;
  onChange: (file: File | null) => void;
  label?: string;
}

export default function PhotoUpload({ current, onChange, label }: Props) {
  const { t } = useTranslation();
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setPreview(URL.createObjectURL(file));
      onChange(file);
    }
    e.target.value = "";
  };

  const displaySrc = preview ?? (current ? `/uploads/${current}` : null);

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-surface-200">{label}</span>}

      <div
        onClick={() => galleryRef.current?.click()}
        className="relative w-full aspect-video rounded-2xl border-2 border-dashed border-surface-600 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors hover:bg-surface-700/50 active:bg-surface-700 overflow-hidden"
      >
        {displaySrc ? (
          <img src={displaySrc} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
        ) : (
          <>
            <svg className="w-10 h-10 text-surface-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-surface-400">{t("common.uploadPhoto")}</span>
          </>
        )}

        {displaySrc && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 rounded-2xl transition-opacity">
            <span className="text-white text-sm font-medium">{t("common.changePhoto")}</span>
          </div>
        )}
      </div>

      {/* Gallery + Camera buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => galleryRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-surface-700 border border-surface-600 text-sm text-surface-200 hover:bg-surface-600 active:bg-surface-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Галерея
        </button>
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-surface-700 border border-surface-600 text-sm text-surface-200 hover:bg-surface-600 active:bg-surface-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Камера
        </button>
      </div>

      {/* Gallery input — no capture, opens file picker */}
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      {/* Camera input — capture forces camera */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
    </div>
  );
}

import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

interface Props {
  current?: string | null; // existing photo path
  onChange: (file: File | null) => void;
  label?: string;
}

export default function PhotoUpload({ current, onChange, label }: Props) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file) {
      setPreview(URL.createObjectURL(file));
      onChange(file);
    }
  };

  const displaySrc = preview ?? (current ? `/uploads/${current}` : null);

  return (
    <div className="flex flex-col gap-2">
      {label && <span className="text-sm font-medium text-surface-200">{label}</span>}
      <div
        onClick={() => fileRef.current?.click()}
        className={`
          relative w-full aspect-video rounded-2xl border-2 border-dashed
          flex flex-col items-center justify-center gap-2 cursor-pointer
          transition-colors hover:bg-surface-700/50 active:bg-surface-700
          ${displaySrc ? "border-surface-600" : "border-surface-600"}
        `}
      >
        {displaySrc ? (
          <img
            src={displaySrc}
            alt="Preview"
            className="w-full h-full object-cover rounded-2xl"
          />
        ) : (
          <>
            <svg
              className="w-10 h-10 text-surface-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm text-surface-400">{t("common.uploadPhoto")}</span>
          </>
        )}

        {displaySrc && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 hover:opacity-100 rounded-2xl transition-opacity">
            <span className="text-white text-sm font-medium">{t("common.uploadPhoto")}</span>
          </div>
        )}
      </div>

      {/* Hidden file input — accept images and camera capture */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  );
}

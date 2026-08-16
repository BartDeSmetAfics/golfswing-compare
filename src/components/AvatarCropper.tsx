"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/context/LocaleContext";

interface Props {
  file: File;
  onConfirm: (base64: string) => void;
  onCancel: () => void;
}

const CIRCLE_SIZE = 248; // visible circle diameter in px
const OUTPUT_SIZE = 200; // exported image size

export default function AvatarCropper({ file, onConfirm, onCancel }: Props) {
  const { t } = useLocale();

  const [imgSrc, setImgSrc] = useState("");
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const imgRef = useRef<HTMLImageElement>(null);
  // Map of pointerId → last known client position
  const ptrs = useRef<Map<number, { x: number; y: number }>>(new Map());

  // Create object URL for the picked file
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setImgSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Base scale: make image cover the circle at zoom=1
  const baseScale =
    naturalSize.w && naturalSize.h
      ? Math.max(CIRCLE_SIZE / naturalSize.w, CIRCLE_SIZE / naturalSize.h)
      : 1;

  // Clamp offset so image always covers the circle
  const clampOffset = useCallback(
    (ox: number, oy: number, z: number) => {
      const totalScale = baseScale * z;
      const displayW = naturalSize.w * totalScale;
      const displayH = naturalSize.h * totalScale;
      const maxX = Math.max(0, (displayW - CIRCLE_SIZE) / 2);
      const maxY = Math.max(0, (displayH - CIRCLE_SIZE) / 2);
      return {
        x: Math.max(-maxX, Math.min(maxX, ox)),
        y: Math.max(-maxY, Math.min(maxY, oy)),
      };
    },
    [baseScale, naturalSize]
  );

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    ptrs.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const prev = ptrs.current.get(e.pointerId);
    if (!prev) return;

    const cur = { x: e.clientX, y: e.clientY };

    if (ptrs.current.size === 1) {
      // Single pointer → pan
      const dx = cur.x - prev.x;
      const dy = cur.y - prev.y;
      setOffset((o) => {
        const clamped = clampOffset(o.x + dx, o.y + dy, zoom);
        return clamped;
      });
    } else {
      // Two pointers → pinch zoom
      const otherEntry = [...ptrs.current.entries()].find(([id]) => id !== e.pointerId);
      if (otherEntry) {
        const [, other] = otherEntry;
        const prevDist = Math.hypot(prev.x - other.x, prev.y - other.y);
        const newDist = Math.hypot(cur.x - other.x, cur.y - other.y);
        if (prevDist > 0) {
          const ratio = newDist / prevDist;
          setZoom((z) => {
            const next = Math.max(1, Math.min(4, z * ratio));
            setOffset((o) => clampOffset(o.x, o.y, next));
            return next;
          });
        }
      }
    }

    ptrs.current.set(e.pointerId, cur);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    ptrs.current.delete(e.pointerId);
  }

  function handleZoomSlider(e: React.ChangeEvent<HTMLInputElement>) {
    const next = parseFloat(e.target.value);
    setZoom(next);
    setOffset((o) => clampOffset(o.x, o.y, next));
  }

  function handleConfirm() {
    const img = imgRef.current;
    if (!img || !naturalSize.w) return;

    const totalScale = baseScale * zoom;
    const displayW = naturalSize.w * totalScale;
    const displayH = naturalSize.h * totalScale;

    // Top-left of the image in circle-container coordinates
    const imgLeft = CIRCLE_SIZE / 2 + offset.x - displayW / 2;
    const imgTop = CIRCLE_SIZE / 2 + offset.y - displayH / 2;

    // Corresponding source rectangle in natural-image coordinates
    const srcX = -imgLeft / totalScale;
    const srcY = -imgTop / totalScale;
    const srcSize = CIRCLE_SIZE / totalScale;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, srcX, srcY, srcSize, srcSize, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    onConfirm(canvas.toDataURL("image/jpeg", 0.85));
  }

  const totalScale = baseScale * zoom;
  const displayW = naturalSize.w * totalScale;
  const displayH = naturalSize.h * totalScale;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-0 sm:p-6">
      <div className="bg-green-950 rounded-t-3xl sm:rounded-2xl p-6 flex flex-col gap-5 w-full sm:max-w-sm border-t border-green-800 sm:border">

        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">{t.cropTitle}</h2>
          <p className="text-green-500 text-xs">{t.cropDrag}</p>
        </div>

        {/* Circle crop viewport */}
        <div className="flex justify-center">
          <div
            style={{ width: CIRCLE_SIZE, height: CIRCLE_SIZE }}
            className="relative rounded-full overflow-hidden cursor-grab active:cursor-grabbing select-none ring-4 ring-green-600 bg-green-900/60 touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {imgSrc && (
              <img
                ref={imgRef}
                src={imgSrc}
                alt=""
                draggable={false}
                onLoad={(e) => {
                  const el = e.currentTarget;
                  setNaturalSize({ w: el.naturalWidth, h: el.naturalHeight });
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: displayW || "auto",
                  height: displayH || "auto",
                  maxWidth: "none",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                  userSelect: "none",
                  pointerEvents: "none",
                }}
              />
            )}
          </div>
        </div>

        {/* Zoom slider */}
        <div className="flex items-center gap-3">
          <span className="text-green-500 text-sm font-bold leading-none">−</span>
          <input
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={zoom}
            onChange={handleZoomSlider}
            className="flex-1 h-1.5 rounded-full appearance-none bg-green-800 accent-green-500"
          />
          <span className="text-green-500 text-sm font-bold leading-none">+</span>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl border border-green-700 text-green-300 text-sm hover:bg-green-900 transition"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition"
          >
            {t.cropConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}

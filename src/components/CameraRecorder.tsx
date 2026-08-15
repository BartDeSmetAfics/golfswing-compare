"use client";

import { useRef, useState, useCallback } from "react";

interface Props {
  onRecordingComplete: (blob: Blob) => void;
}

export default function CameraRecorder({ onRecordingComplete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [state, setState] = useState<"idle" | "streaming" | "recording" | "done">("idle");
  const [error, setError] = useState("");

  const startCamera = useCallback(async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setState("streaming");
    } catch {
      setError("Camera access denied. Please allow camera access and try again.");
    }
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];

    const mimeType = MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ? "video/webm;codecs=vp9"
      : "video/webm";

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      onRecordingComplete(blob);
      setState("done");
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };

    mediaRecorderRef.current = recorder;
    recorder.start(100);
    setState("recording");
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-full max-w-sm aspect-[9/16] bg-black rounded-xl overflow-hidden">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
        />
        {state === "recording" && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-medium">REC</span>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      {state === "idle" && (
        <button
          onClick={startCamera}
          className="bg-green-600 hover:bg-green-500 text-white rounded-xl px-8 py-3 font-semibold"
        >
          Start camera
        </button>
      )}

      {state === "streaming" && (
        <button
          onClick={startRecording}
          className="bg-red-600 hover:bg-red-500 text-white rounded-xl px-8 py-3 font-semibold"
        >
          Start recording
        </button>
      )}

      {state === "recording" && (
        <button
          onClick={stopRecording}
          className="bg-white text-red-600 border-2 border-red-600 rounded-xl px-8 py-3 font-semibold"
        >
          Stop recording
        </button>
      )}

      {state === "done" && (
        <p className="text-green-400 text-sm font-medium">
          Recording complete — analysing swing…
        </p>
      )}
    </div>
  );
}

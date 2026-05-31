"use client";

import { useState, useRef, useCallback } from "react";
import {
  Camera, CameraOff, Mic, MicOff, Square, Play, Pause,
  AlertCircle, CheckCircle, Timer,
} from "lucide-react";

const TIER_LIMITS: Record<string, number> = {
  reel: 90,
  monologue: 600,
  song: 600,
  dance: 600,
  comedy: 600,
  cover: 600,
  voice_demo: 1800,
};

interface ReelRecorderProps {
  reelType: string;
  onRecordingComplete: (blob: Blob, durationSeconds: number) => void;
}

function formatDuration(s: number) {
  const m = Math.floor(s / 60);
  const sec = String(Math.floor(s % 60)).padStart(2, "0");
  return `${m}:${sec}`;
}

export function ReelRecorder({ reelType, onRecordingComplete }: ReelRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [phase, setPhase] = useState<"idle" | "preview" | "recording" | "done">("idle");
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [camEnabled, setCamEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(true);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const limit = TIER_LIMITS[reelType] ?? 600;
  const timeLeft = limit - elapsed;
  const pct = Math.min(100, (elapsed / limit) * 100);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play();
      }
      setPhase("preview");
    } catch (e) {
      setError("Camera/microphone access denied. Please allow permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startRecording = useCallback(() => {
    if (!streamRef.current) return;
    chunksRef.current = [];
    setElapsed(0);

    const mr = new MediaRecorder(streamRef.current, {
      mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
        ? "video/webm;codecs=vp9"
        : "video/webm",
    });

    mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setPhase("done");
      stopCamera();
      onRecordingComplete(blob, elapsed);
    };

    mr.start(200); // collect data every 200 ms
    mediaRecorderRef.current = mr;
    setPhase("recording");

    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        const next = prev + 1;
        if (next >= limit) {
          mr.stop();
          if (timerRef.current) clearInterval(timerRef.current);
        }
        return next;
      });
    }, 1000);
  }, [elapsed, limit, onRecordingComplete, stopCamera]);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const toggleCam = () => {
    streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = !t.enabled; });
    setCamEnabled((v) => !v);
  };

  const toggleMic = () => {
    streamRef.current?.getAudioTracks().forEach((t) => { t.enabled = !t.enabled; });
    setMicEnabled((v) => !v);
  };

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setElapsed(0);
    setPhase("idle");
  };

  return (
    <div className="rounded-2xl overflow-hidden bg-black border border-white/10 relative">
      {/* Camera / Preview viewport */}
      <div className="relative w-full aspect-[9/16] bg-[#0a0a0a] flex items-center justify-center">
        {phase === "done" && previewUrl ? (
          <video src={previewUrl} controls loop playsInline className="w-full h-full object-cover" />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${phase === "idle" ? "opacity-0" : ""}`}
            style={{ transform: "scaleX(-1)" }}
          />
        )}

        {phase === "idle" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
            <Camera className="w-12 h-12 opacity-30" />
            <p className="text-sm text-white/50">Tap to start camera</p>
          </div>
        )}

        {/* Recording indicator */}
        {phase === "recording" && (
          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-white text-sm font-bold font-mono">{formatDuration(elapsed)}</span>
          </div>
        )}

        {/* Time remaining ring */}
        {(phase === "recording" || phase === "preview") && (
          <div className="absolute top-4 right-4">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="14" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                <circle
                  cx="18" cy="18" r="14"
                  fill="none"
                  stroke={timeLeft <= 10 ? "#ef4444" : "#a9000f"}
                  strokeWidth="3"
                  strokeDasharray="87.96"
                  strokeDashoffset={87.96 * (pct / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Timer className="w-3.5 h-3.5 text-white/70" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-[#111] flex flex-col gap-3">
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Limit badge */}
        <div className="text-white/40 text-xs text-center">
          Max for <span className="text-white/70 font-semibold">{reelType}</span>:{" "}
          {formatDuration(limit)}
        </div>

        {/* Progress bar */}
        {phase === "recording" && (
          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${pct}%`,
                background: timeLeft <= 10 ? "#ef4444" : "linear-gradient(90deg, #a9000f, #8b0000)",
              }}
            />
          </div>
        )}

        <div className="flex items-center justify-center gap-4">
          {phase === "idle" && (
            <button
              onClick={startCamera}
              className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#a9000f] to-[#8b0000] text-white font-bold text-sm hover:shadow-lg hover:shadow-[#a9000f]/30 transition-all"
            >
              <Camera className="w-4 h-4" /> Open Camera
            </button>
          )}

          {phase === "preview" && (
            <>
              <button onClick={toggleCam} className={`p-2.5 rounded-full ${camEnabled ? "bg-white/10" : "bg-red-500/20"} text-white hover:bg-white/20 transition-colors`}>
                {camEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
              </button>
              <button
                onClick={startRecording}
                className="w-14 h-14 rounded-full bg-gradient-to-br from-[#a9000f] to-[#8b0000] flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                <div className="w-5 h-5 rounded-full bg-white" />
              </button>
              <button onClick={toggleMic} className={`p-2.5 rounded-full ${micEnabled ? "bg-white/10" : "bg-red-500/20"} text-white hover:bg-white/20 transition-colors`}>
                {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            </>
          )}

          {phase === "recording" && (
            <>
              <button onClick={toggleCam} className={`p-2.5 rounded-full ${camEnabled ? "bg-white/10" : "bg-red-500/20"} text-white hover:bg-white/20 transition-colors`}>
                {camEnabled ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
              </button>
              <button
                onClick={stopRecording}
                className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
              >
                <Square className="w-6 h-6 text-white fill-white" />
              </button>
              <button onClick={toggleMic} className={`p-2.5 rounded-full ${micEnabled ? "bg-white/10" : "bg-red-500/20"} text-white hover:bg-white/20 transition-colors`}>
                {micEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
            </>
          )}

          {phase === "done" && (
            <div className="flex items-center gap-3">
              <button onClick={reset} className="px-4 py-2 rounded-full bg-white/10 text-white text-sm hover:bg-white/20 transition-colors">
                Re-record
              </button>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold">
                <CheckCircle className="w-4 h-4" /> Recorded ({formatDuration(elapsed)})
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Play, Pause, Volume2, VolumeX, AlertTriangle, Lock } from "lucide-react";
import { WaveformPlayer } from "./WaveformPlayer";
import { Caption } from "./CaptionEditor";

interface SecureReelPlayerProps {
  src: string;
  peaks?: number[];
  captions?: Caption[];
  watermarkEnabled?: boolean;
  watermarkText?: string;
  downloadAllowed?: boolean;
  visibility?: string;
  scoutExpiresAt?: string | null;
  onTimeUpdate?: (time: number) => void;
}

export function SecureReelPlayer({
  src,
  peaks = [],
  captions = [],
  watermarkEnabled = true,
  watermarkText = "StageLink",
  downloadAllowed = false,
  visibility = "public",
  scoutExpiresAt = null,
  onTimeUpdate,
}: SecureReelPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeCap, setActiveCap] = useState<Caption | null>(null);

  // Watermark overlay via canvas
  const drawWatermark = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || !watermarkEnabled) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Diagonal repeating watermark
    ctx.save();
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = "#ffffff";
    ctx.font = `bold ${Math.max(14, W * 0.04)}px Inter, sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const text = watermarkText;
    const cols = Math.ceil(W / 180) + 1;
    const rows = Math.ceil(H / 100) + 1;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.save();
        ctx.translate(c * 180 - 40, r * 100 - 20);
        ctx.rotate(-Math.PI / 8);
        ctx.fillText(text, 0, 0);
        ctx.restore();
      }
    }
    ctx.restore();

    animRef.current = requestAnimationFrame(drawWatermark);
  }, [watermarkEnabled, watermarkText]);

  useEffect(() => {
    if (watermarkEnabled) {
      animRef.current = requestAnimationFrame(drawWatermark);
    }
    return () => cancelAnimationFrame(animRef.current);
  }, [watermarkEnabled, drawWatermark]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onLoaded = () => setDuration(video.duration);
    const onTime = () => {
      const t = video.currentTime;
      setCurrentTime(t);
      onTimeUpdate?.(t);
      const cap = captions.find((c) => t >= c.start && t <= c.end) || null;
      setActiveCap(cap);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);

    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTime);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);

    // Block right-click context menu to prevent download
    const blockCtx = (e: MouseEvent) => { if (!downloadAllowed) e.preventDefault(); };
    video.addEventListener("contextmenu", blockCtx);

    return () => {
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTime);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("contextmenu", blockCtx);
    };
  }, [captions, downloadAllowed, onTimeUpdate]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); } else { v.pause(); }
  };

  const handleSeek = (time: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = time;
    setCurrentTime(time);
  };

  const scoutExpired =
    visibility === "scout_only" &&
    scoutExpiresAt &&
    new Date(scoutExpiresAt) < new Date();

  if (scoutExpired) {
    return (
      <div className="aspect-video bg-black/80 rounded-2xl flex flex-col items-center justify-center gap-3 text-white">
        <Lock className="w-10 h-10 opacity-40" />
        <p className="text-sm opacity-60">Scout access has expired</p>
      </div>
    );
  }

  return (
    <div className="relative rounded-2xl overflow-hidden bg-black select-none">
      {/* Video */}
      <video
        ref={videoRef}
        src={src}
        loop
        muted={muted}
        playsInline
        className="w-full aspect-video object-cover"
        onClickCapture={togglePlay}
        // Prevent keyboard download shortcuts
        onKeyDown={(e) => { if (!downloadAllowed && (e.key === "s" && e.ctrlKey)) e.preventDefault(); }}
      />

      {/* Watermark canvas */}
      {watermarkEnabled && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
          width={640}
          height={360}
        />
      )}

      {/* Caption overlay */}
      {activeCap && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 max-w-[80%] text-center px-4 py-2 bg-black/70 rounded-xl text-white text-sm font-medium shadow-lg pointer-events-none">
          {activeCap.text}
        </div>
      )}

      {/* Controls bar */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 to-transparent flex flex-col gap-2">
        {peaks.length > 0 && (
          <WaveformPlayer
            peaks={peaks}
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            height={36}
          />
        )}
        <div className="flex items-center gap-3">
          <button onClick={togglePlay} className="w-8 h-8 flex items-center justify-center text-white hover:scale-110 transition-transform">
            {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-white" />}
          </button>
          <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden cursor-pointer" onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            handleSeek(((e.clientX - rect.left) / rect.width) * duration);
          }}>
            <div className="h-full bg-[#a9000f] transition-all" style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }} />
          </div>
          <span className="text-white/60 text-xs font-mono shrink-0">
            {Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, "0")} / {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, "0")}
          </span>
          <button onClick={() => setMuted(!muted)} className="text-white/70 hover:text-white transition-colors">
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          {!downloadAllowed && (
            <div className="text-white/30" title="Downloads disabled">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>

      {/* Play/pause central overlay */}
      {!playing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
            <Play className="w-8 h-8 text-white fill-white ml-1" />
          </div>
        </div>
      )}
    </div>
  );
}

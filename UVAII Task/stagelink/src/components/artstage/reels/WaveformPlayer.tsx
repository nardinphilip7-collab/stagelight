"use client";

import { useRef, useEffect, useCallback } from "react";

interface WaveformPlayerProps {
  peaks: number[];          // Normalised 0–1 amplitude array
  currentTime: number;      // seconds
  duration: number;         // seconds
  onSeek?: (time: number) => void;
  accentColor?: string;
  height?: number;
}

export function WaveformPlayer({
  peaks,
  currentTime,
  duration,
  onSeek,
  accentColor = "#a9000f",
  height = 64,
}: WaveformPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || peaks.length === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth;
    const H = canvas.offsetHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, W, H);

    const barW = Math.max(2, W / peaks.length - 1);
    const gap = Math.max(1, W / peaks.length - barW);
    const mid = H / 2;
    const progress = duration > 0 ? currentTime / duration : 0;

    peaks.forEach((amp, i) => {
      const x = i * (barW + gap);
      const barH = Math.max(2, amp * (H * 0.85));
      const isPlayed = x / W < progress;

      ctx.beginPath();
      ctx.roundRect(x, mid - barH / 2, barW, barH, 2);
      if (isPlayed) {
        ctx.fillStyle = accentColor;
      } else {
        ctx.fillStyle = "rgba(255,255,255,0.25)";
      }
      ctx.fill();
    });

    // Progress cursor
    if (duration > 0) {
      const cx = progress * W;
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, H);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }, [peaks, currentTime, duration, accentColor]);

  useEffect(() => {
    draw();
  }, [draw]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    onSeek(ratio * duration);
  };

  if (peaks.length === 0) {
    return (
      <div
        className="w-full rounded-lg bg-white/10 flex items-center justify-center"
        style={{ height }}
      >
        <span className="text-xs text-white/40">No waveform</span>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      className="w-full rounded-lg cursor-pointer"
      style={{ height, display: "block" }}
    />
  );
}

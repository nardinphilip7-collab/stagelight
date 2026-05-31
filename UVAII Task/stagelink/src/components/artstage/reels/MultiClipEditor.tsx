"use client";

import { useState, useRef, useCallback } from "react";
import {
  Plus, Trash2, GripVertical, Play, ChevronUp, ChevronDown,
  Film, Merge, AlertCircle,
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

interface Clip {
  id: string;
  name: string;
  durationSeconds: number;
  url: string;      // object URL or remote URL for preview
  blob?: Blob;
}

interface MultiClipEditorProps {
  reelType: string;
  onClipsChange: (clips: Clip[], totalDuration: number) => void;
}

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
}

export function MultiClipEditor({ reelType, onClipsChange }: MultiClipEditorProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const limit = TIER_LIMITS[reelType] ?? 600;
  const totalDuration = clips.reduce((s, c) => s + c.durationSeconds, 0);
  const remaining = limit - totalDuration;

  const notify = useCallback(
    (updated: Clip[]) => {
      onClipsChange(updated, updated.reduce((s, c) => s + c.durationSeconds, 0));
    },
    [onClipsChange]
  );

  const handleFileAdd = async (files: FileList | null) => {
    if (!files) return;
    setError(null);
    const newClips: Clip[] = [];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("video/")) continue;
      const url = URL.createObjectURL(file);
      // Get duration via a temporary video element
      const dur = await new Promise<number>((resolve) => {
        const v = document.createElement("video");
        v.preload = "metadata";
        v.onloadedmetadata = () => { URL.revokeObjectURL(v.src); resolve(v.duration); };
        v.onerror = () => resolve(0);
        v.src = url;
      });
      const finalUrl = URL.createObjectURL(file);
      newClips.push({ id: crypto.randomUUID(), name: file.name, durationSeconds: dur, url: finalUrl, blob: file });
    }

    const updated = [...clips, ...newClips];
    const newTotal = updated.reduce((s, c) => s + c.durationSeconds, 0);
    if (newTotal > limit) {
      setError(`Total duration would exceed the ${fmt(limit)} limit for ${reelType}.`);
      newClips.forEach((c) => URL.revokeObjectURL(c.url));
      return;
    }
    setClips(updated);
    notify(updated);
  };

  const removeClip = (id: string) => {
    const updated = clips.filter((c) => c.id !== id);
    setClips(updated);
    notify(updated);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= clips.length) return;
    const updated = [...clips];
    const [item] = updated.splice(from, 1);
    updated.splice(to, 0, item);
    setClips(updated);
    notify(updated);
  };

  // Drag-and-drop
  const onDragStart = (i: number) => setDragIdx(i);
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setOverIdx(i); };
  const onDrop = (i: number) => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return; }
    move(dragIdx, i);
    setDragIdx(null);
    setOverIdx(null);
  };

  const limitPct = Math.min(100, (totalDuration / limit) * 100);
  const overLimit = totalDuration > limit;

  return (
    <div className="flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/70 text-xs font-semibold uppercase tracking-wider">
          <Film className="w-4 h-4" />
          Multi-Clip Compiler
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add Clips
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFileAdd(e.target.files)}
        />
      </div>

      {/* Duration bar */}
      <div>
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-white/50">Total: <span className="text-white font-mono">{fmt(totalDuration)}</span></span>
          <span className={overLimit ? "text-red-400 font-semibold" : "text-white/50"}>
            Limit: <span className="font-mono">{fmt(limit)}</span>
            {remaining >= 0 && <span className="ml-1 text-white/30">({fmt(remaining)} left)</span>}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${limitPct}%`,
              background: overLimit ? "#ef4444" : "linear-gradient(90deg, #a9000f, #8b0000)",
            }}
          />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Clip list */}
      {clips.length === 0 ? (
        <div
          className="border-2 border-dashed border-white/10 rounded-2xl py-10 flex flex-col items-center gap-2 cursor-pointer hover:border-white/20 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Film className="w-8 h-8 text-white/20" />
          <p className="text-white/30 text-sm">Add video clips to compile a reel</p>
          <p className="text-white/20 text-xs">Drag &amp; drop or click to browse</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {clips.map((clip, i) => (
            <div
              key={clip.id}
              draggable
              onDragStart={() => onDragStart(i)}
              onDragOver={(e) => onDragOver(e, i)}
              onDrop={() => onDrop(i)}
              onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                overIdx === i ? "border-[#a9000f] bg-[#a9000f]/10" : "border-white/10 bg-white/5"
              } ${dragIdx === i ? "opacity-40" : ""}`}
            >
              <GripVertical className="w-4 h-4 text-white/30 shrink-0" />

              {/* Thumbnail placeholder */}
              <div className="w-12 h-9 rounded-lg bg-white/10 overflow-hidden shrink-0">
                <video src={clip.url} muted playsInline className="w-full h-full object-cover" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-white/80 text-xs font-medium truncate">{clip.name}</p>
                <p className="text-white/40 text-[10px] font-mono">{fmt(clip.durationSeconds)}</p>
              </div>

              <div className="flex items-center gap-1">
                <button onClick={() => move(i, i - 1)} disabled={i === 0} className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-20 transition-colors">
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => move(i, i + 1)} disabled={i === clips.length - 1} className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-white disabled:opacity-20 transition-colors">
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => removeClip(clip.id)} className="p-1 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {clips.length > 1 && (
        <div className="flex items-center gap-2 text-white/30 text-xs">
          <Merge className="w-3.5 h-3.5" />
          {clips.length} clips will be compiled on upload
        </div>
      )}
    </div>
  );
}

export type { Clip };

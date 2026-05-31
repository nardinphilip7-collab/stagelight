"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Edit3, Check, Plus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";

export interface Caption {
  start: number; // seconds
  end: number;
  text: string;
}

interface CaptionEditorProps {
  captions: Caption[];
  onChange: (captions: Caption[]) => void;
  currentTime?: number; // for highlighting the active caption
  duration?: number;
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1).padStart(4, "0");
  return `${m}:${sec}`;
}

export function CaptionEditor({ captions, onChange, currentTime = 0, duration = 0 }: CaptionEditorProps) {
  const [editing, setEditing] = useState<number | null>(null);
  const [draft, setDraft] = useState<Caption | null>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  const activeIdx = captions.findIndex(
    (c) => currentTime >= c.start && currentTime <= c.end
  );

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeIdx]);

  const save = useCallback(() => {
    if (editing === null || !draft) return;
    const next = [...captions];
    next[editing] = draft;
    onChange(next.sort((a, b) => a.start - b.start));
    setEditing(null);
    setDraft(null);
  }, [editing, draft, captions, onChange]);

  const remove = (i: number) => {
    const next = [...captions];
    next.splice(i, 1);
    onChange(next);
    if (editing === i) { setEditing(null); setDraft(null); }
  };

  const addNew = () => {
    const lastEnd = captions.length > 0 ? captions[captions.length - 1].end : 0;
    const newCap: Caption = { start: lastEnd, end: Math.min(lastEnd + 3, duration || lastEnd + 3), text: "" };
    const next = [...captions, newCap];
    onChange(next);
    setEditing(next.length - 1);
    setDraft(newCap);
  };

  const shiftTime = (field: "start" | "end", delta: number) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: Math.max(0, parseFloat((draft[field] + delta).toFixed(1))) });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">Captions</span>
        <button
          onClick={addNew}
          className="flex items-center gap-1 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
        >
          <Plus className="w-3 h-3" /> Add
        </button>
      </div>

      {captions.length === 0 && (
        <p className="text-white/30 text-xs text-center py-4 border border-dashed border-white/10 rounded-xl">
          No captions yet. Add a caption or generate automatically.
        </p>
      )}

      <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1 caption-scroll">
        {captions.map((cap, i) => {
          const isActive = i === activeIdx;
          const isEditing = i === editing;

          return (
            <div
              key={i}
              ref={isActive ? activeRef : undefined}
              className={`rounded-xl border transition-all text-sm ${
                isActive
                  ? "border-[#a9000f] bg-[#a9000f]/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {isEditing && draft ? (
                <div className="p-3 flex flex-col gap-2">
                  <textarea
                    className="w-full bg-transparent border border-white/20 rounded-lg px-3 py-2 text-white text-sm resize-none outline-none focus:border-[#a9000f]"
                    rows={2}
                    value={draft.text}
                    onChange={(e) => setDraft({ ...draft, text: e.target.value })}
                    autoFocus
                  />
                  <div className="flex gap-3 text-white/70 text-xs">
                    <div className="flex items-center gap-1">
                      <span className="opacity-60">In</span>
                      <button onClick={() => shiftTime("start", -0.1)} className="p-0.5 hover:text-white"><ChevronLeft className="w-3.5 h-3.5"/></button>
                      <span className="font-mono">{formatTime(draft.start)}</span>
                      <button onClick={() => shiftTime("start", 0.1)} className="p-0.5 hover:text-white"><ChevronRight className="w-3.5 h-3.5"/></button>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="opacity-60">Out</span>
                      <button onClick={() => shiftTime("end", -0.1)} className="p-0.5 hover:text-white"><ChevronLeft className="w-3.5 h-3.5"/></button>
                      <span className="font-mono">{formatTime(draft.end)}</span>
                      <button onClick={() => shiftTime("end", 0.1)} className="p-0.5 hover:text-white"><ChevronRight className="w-3.5 h-3.5"/></button>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => { setEditing(null); setDraft(null); }} className="px-3 py-1 rounded-lg text-white/50 hover:text-white text-xs">Cancel</button>
                    <button onClick={save} className="flex items-center gap-1 px-3 py-1 bg-[#a9000f] rounded-lg text-white text-xs font-semibold hover:bg-[#8b0000]">
                      <Check className="w-3 h-3"/> Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 pl-3">
                  <span className="font-mono text-[10px] text-white/40 shrink-0">
                    {formatTime(cap.start)}
                  </span>
                  <span className="flex-1 text-white/80 text-xs line-clamp-2 min-w-0">
                    {cap.text || <span className="italic text-white/30">empty</span>}
                  </span>
                  <button onClick={() => { setEditing(i); setDraft({ ...cap }); }} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors shrink-0">
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(i)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .caption-scroll::-webkit-scrollbar { width: 4px; }
        .caption-scroll::-webkit-scrollbar-track { background: transparent; }
        .caption-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 2px; }
      `}</style>
    </div>
  );
}

'use client';
import type { Artist, Reel } from '@/lib/artstage/types';
import { Film, Trash2 } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useState } from 'react';

interface ReelsTabProps { artist: Artist; reels: Reel[]; isOwner?: boolean; }

export function ReelsTab({ artist, reels: initialReels, isOwner }: ReelsTabProps) {
  const [reels, setReels] = useState(initialReels);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this reel?")) return;
    try {
      await apiClient.delete(`/reels/${id}/`);
      setReels(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete reel");
    }
  };

  return (
    <div className="px-4 py-6">
      {reels.length === 0 ? (
          <div style={{ background: "rgba(22,22,24,0.6)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "14px", padding: "40px 24px", textAlign: "center" }}>
            <Film className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--as-text-muted)", opacity: 0.4 }} />
            <p className="text-sm font-medium" style={{ color: "var(--as-text-muted)" }}>{artist.stageName} has no reels yet.</p>
          </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {reels.map((r) => (
            <div key={r.id} className="relative aspect-video rounded-xl bg-[var(--as-surface)] border border-[var(--as-border)] flex items-center justify-center overflow-hidden group">
              {r.videoUrl ? (
                <video src={r.videoUrl} className="w-full h-full object-cover" />
              ) : (
                <span className="text-[var(--as-text-muted)] text-xs">{r.title}</span>
              )}
              {isOwner && (
                <button 
                  onClick={(e) => handleDelete(e, r.id)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500/80 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

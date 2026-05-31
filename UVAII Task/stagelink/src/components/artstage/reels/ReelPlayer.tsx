'use client';
import { useEffect, useRef } from 'react';
import type { Reel } from '@/lib/artstage/types';
import { CaptionedVideo } from '../shared/CaptionedVideo';
import { ReelMetadataPanel } from './ReelMetadataPanel';
import { X } from 'lucide-react';

interface ReelPlayerProps {
  reel: Reel;
  onClose: () => void;
}

export function ReelPlayer({ reel, onClose }: ReelPlayerProps) {
  const closeRef = useRef<HTMLButtonElement>(null);

  // Trap focus and handle Escape
  useEffect(() => {
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(26,26,26,0.85)' }}
      role="dialog"
      aria-modal="true"
      aria-label={`Playing: ${reel.title}`}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-4xl mx-4 rounded-[8px] overflow-hidden flex flex-col md:flex-row"
        style={{ backgroundColor: 'var(--as-surface)', maxHeight: '90vh' }}
      >
        {/* Close button */}
        <button
          ref={closeRef}
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Close player"
        >
          <X size={18} />
        </button>

        {/* Video */}
        <div className="flex-1" style={{ aspectRatio: '16/9', maxHeight: 400 }}>
          <CaptionedVideo
            src={reel.videoUrl}
            poster={reel.thumbnailUrl}
            hasCaptions={reel.hasCaptions}
            className="w-full h-full"
            autoPlay
          />
        </div>

        {/* Metadata panel */}
        <div className="md:w-72 shrink-0 overflow-y-auto p-4 border-l" style={{ borderColor: 'var(--as-border)' }}>
          <ReelMetadataPanel reel={reel} />
        </div>
      </div>
    </div>
  );
}

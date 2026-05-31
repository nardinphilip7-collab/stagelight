'use client';
import { useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Captions } from 'lucide-react';

interface CaptionedVideoProps {
  src: string;
  poster?: string;
  hasCaptions?: boolean;
  className?: string;
  autoPlay?: boolean;
}

export function CaptionedVideo({ src, poster, hasCaptions = false, className = '', autoPlay = false }: CaptionedVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [captionsOn, setCaptionsOn] = useState(hasCaptions);
  const [progress, setProgress] = useState(0);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !muted;
    setMuted(!muted);
  };

  const onTimeUpdate = () => {
    if (!videoRef.current) return;
    const { currentTime, duration } = videoRef.current;
    setProgress(duration ? (currentTime / duration) * 100 : 0);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * videoRef.current.duration;
  };

  return (
    <div className={`relative bg-black overflow-hidden ${className}`} role="group" aria-label="Video player">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        muted={muted}
        loop
        playsInline
        autoPlay={autoPlay}
        onTimeUpdate={onTimeUpdate}
        onEnded={() => setPlaying(false)}
        onClick={togglePlay}
        className="w-full h-full object-cover cursor-pointer"
        aria-label="Video content"
      >
        {hasCaptions && (
          <track kind="captions" src="/captions.vtt" srcLang="en" label="English" default={captionsOn} />
        )}
      </video>

      {/* Overlay controls */}
      <div className="absolute inset-0 flex flex-col justify-end pointer-events-none">
        {/* Progress bar */}
        <div
          className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 cursor-pointer pointer-events-auto"
          onClick={handleSeek}
          role="slider"
          aria-label="Video progress"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full bg-white transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Buttons */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-auto">
          <button
            onClick={togglePlay}
            className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white"
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <div className="flex gap-1">
            {hasCaptions && (
              <button
                onClick={() => setCaptionsOn(v => !v)}
                className={`p-1.5 rounded-full text-white focus-visible:ring-2 focus-visible:ring-white ${captionsOn ? 'bg-white/30' : 'bg-black/40 hover:bg-black/60'}`}
                aria-label={captionsOn ? 'Hide captions' : 'Show captions'}
                aria-pressed={captionsOn}
              >
                <Captions size={14} />
              </button>
            )}
            <button
              onClick={toggleMute}
              className="p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 focus-visible:ring-2 focus-visible:ring-white"
              aria-label={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

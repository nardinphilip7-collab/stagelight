import { useProfile } from "../ProfileContext";
import { Plus, X, Upload, Loader2, Camera } from "lucide-react";
import { useRef, useState } from "react";

export function MediaSection() {
  const {
    avatar, avatarFileRef, avatarUploading, handleAvatarFile,
    showCamera, openCamera, closeCamera, capturePhoto,
    cameraVideoRef, cameraCanvasRef, cameraState, cameraErr,
    headshots, setHeadshots,
  } = useProfile();

  // Internal uploader for headshots
  const hsInputRef = useRef<HTMLInputElement>(null);
  const [hsUploading, setHsUploading] = useState(false);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Media & Portfolio</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload headshots, videos, and audio clips to showcase your talent.</p>
      </div>

      <div className="space-y-8">

        {/* Profile Photo (avatar) */}
        <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-1">Profile Photo</h3>
          <p className="text-xs text-muted-foreground mb-4">Your main avatar, shown on your profile and across the app.</p>
          <div className="flex items-center gap-5">
            <div className="w-24 h-24 rounded-full overflow-hidden border border-border/60 bg-secondary/40 flex items-center justify-center shrink-0">
              {avatar
                ? <img src={avatar} alt="Profile avatar" className="w-full h-full object-cover" />
                : <Camera className="w-7 h-7 text-muted-foreground" />}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => avatarFileRef.current?.click()} disabled={avatarUploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/60 bg-secondary/40 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                {avatarUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {avatarUploading ? "Uploading…" : "Upload photo"}
              </button>
              <button type="button" onClick={openCamera} disabled={avatarUploading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/60 bg-secondary/40 text-sm font-medium text-foreground hover:bg-secondary transition-colors disabled:opacity-50">
                <Camera className="w-4 h-4" /> Take photo
              </button>
            </div>
            <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
          </div>
        </div>

        {/* Camera capture modal */}
        {showCamera && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={closeCamera}>
            <div className="bg-card rounded-2xl border border-border shadow-2xl p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-foreground">Take a profile photo</h3>
                <button type="button" onClick={closeCamera} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="relative aspect-square rounded-xl overflow-hidden bg-black flex items-center justify-center">
                <video ref={cameraVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                {cameraState === "starting" && <Loader2 className="absolute w-8 h-8 animate-spin text-white" />}
                {cameraState === "uploading" && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-sm gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" /> Uploading…
                  </div>
                )}
                {cameraState === "error" && (
                  <p className="absolute inset-0 flex items-center justify-center text-center text-sm text-white px-6">{cameraErr || "Camera error."}</p>
                )}
              </div>
              <canvas ref={cameraCanvasRef} className="hidden" />
              <div className="flex justify-center mt-4">
                <button type="button" onClick={capturePhoto} disabled={cameraState !== "live"}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                  <Camera className="w-5 h-5" /> Capture
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Headshots */}
        <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Headshots & Photos</h3>
              <p className="text-xs text-muted-foreground mt-0.5">The first image is used as your primary avatar.</p>
            </div>
            <span className="text-xs font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-full">{headshots.length}/8</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {headshots.map((url, i) => (
              <div key={i} className="relative aspect-[4/5] rounded-xl overflow-hidden border border-border/40 group shadow-sm">
                <img src={url} alt={`headshot ${i + 1}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                  <button type="button" onClick={() => setHeadshots(headshots.filter((_, j) => j !== i))}
                    className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {i === 0 && (
                  <div className="absolute top-2 left-2 px-2 py-1 bg-background/80 backdrop-blur-md rounded border border-border/50 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                    Primary
                  </div>
                )}
              </div>
            ))}
            
            {headshots.length < 8 && (
              <button type="button" onClick={() => hsInputRef.current?.click()} disabled={hsUploading}
                className="aspect-[4/5] rounded-xl border-2 border-dashed border-border/60 bg-secondary/20 flex flex-col items-center justify-center gap-3 text-muted-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all disabled:opacity-50 group">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-background transition-colors shadow-sm">
                  {hsUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                </div>
                <span className="text-xs font-medium">{hsUploading ? "Uploading…" : "Add photo"}</span>
              </button>
            )}
            <input ref={hsInputRef} type="file" accept="image/*" multiple className="hidden" 
              onChange={async (e) => {
                const files = Array.from(e.target.files ?? []);
                if (!files.length) return;
                setHsUploading(true);
                try {
                  const { uploadFile } = await import("@/lib/upload");
                  const urls = await Promise.all(files.slice(0, 8 - headshots.length).map(f => uploadFile(f)));
                  setHeadshots([...headshots, ...urls]);
                } catch {} finally { setHsUploading(false); }
              }} 
            />
          </div>
        </div>



      </div>
    </div>
  );
}

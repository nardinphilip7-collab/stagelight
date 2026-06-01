"use client";

import { useProfile } from "./ProfileContext";
import { Input } from "@/components/ui/input";
import { CountrySelect } from "@/components/ui/country-select";
import { ReelRecorder } from "@/components/artstage/reels/ReelRecorder";
import { DISCIPLINE_LABELS } from "@/components/profile/DisciplineForm";
import { CheckCircle2, ChevronRight, Loader2, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

const DISCIPLINE_OPTIONS = [
  "actor", "singer", "dancer", "musician", "comedian", "presenter",
  "director", "writer", "cinematographer", "choreographer", "composer",
  "visual_artist", "model", "stage_technician",
];

const WIZARD_STEPS = ["Basics", "Headshots", "Showreel"];

export function SetupWizard() {
  const p = useProfile();
  const hsInputRef = useRef<HTMLInputElement>(null);
  const [hsUploading, setHsUploading] = useState(false);

  const step1Valid = !!(p.talentName.trim() && p.primaryDiscipline && p.location.trim() && p.bio.trim());
  const step2Valid = !!p.avatar || p.headshots.length > 0;

  async function handleHeadshotFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setHsUploading(true);
    try {
      const { uploadFile } = await import("@/lib/upload");
      const urls = await Promise.all(files.slice(0, 8 - p.headshots.length).map(f => uploadFile(f)));
      p.setHeadshots([...p.headshots, ...urls]);
    } catch { /* surfaced via disabled state */ }
    finally {
      setHsUploading(false);
      if (hsInputRef.current) hsInputRef.current.value = "";
    }
  }

  return (
    <div className="min-h-screen bg-background pt-8 pb-20">
      <div className="max-w-xl mx-auto px-4">
        {/* Progress */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-1">Set up your profile</h1>
          <p className="text-sm text-muted-foreground mb-5">A few essentials so casting directors can find you. You can refine everything later.</p>
          <div className="flex items-center gap-2">
            {WIZARD_STEPS.map((label, i) => (
              <div key={label} className="flex-1">
                <div className={`h-1.5 rounded-full transition-colors ${i <= p.wizardStep ? "bg-primary" : "bg-secondary"}`} />
                <p className={`text-[11px] mt-1.5 font-medium ${i === p.wizardStep ? "text-primary" : "text-muted-foreground"}`}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {p.wizardError && (
          <div className="mb-4 px-4 py-2.5 rounded-lg text-sm bg-destructive/10 border border-destructive/30 text-destructive">
            {p.wizardError}
          </div>
        )}

        <div className="bg-card rounded-2xl border border-border p-6">
          {/* Step 1 — Basics */}
          {p.wizardStep === 0 && (
            <div className="space-y-4">
              <div className="mb-2">
                <h2 className="text-xl font-semibold text-foreground">The basics</h2>
                <p className="text-sm text-muted-foreground mt-1">Required to use StageLink.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Stage name *</label>
                <Input value={p.talentName} onChange={e => p.setTalentName(e.target.value)} placeholder="Your stage name" className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Primary discipline *</label>
                <div className="flex flex-wrap gap-2">
                  {DISCIPLINE_OPTIONS.map(d => (
                    <button key={d} type="button" onClick={() => p.setPrimaryDiscipline(d)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                        p.primaryDiscipline === d ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                      }`}>
                      {p.primaryDiscipline === d && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                      {DISCIPLINE_LABELS[d] ?? d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">City *</label>
                  <Input value={p.location} onChange={e => p.setLocation(e.target.value)} placeholder="e.g. London" className="bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Country</label>
                  <CountrySelect value={p.travelInfo.country ?? ""}
                    onChange={v => p.setTravelInfo((prev: any) => ({ ...prev, country: v }))} />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Bio *</label>
                <textarea value={p.bio} onChange={e => p.setBio(e.target.value)} rows={4}
                  placeholder="Tell casting directors about yourself…"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-primary/50 resize-none" />
              </div>
            </div>
          )}

          {/* Step 2 — Headshots */}
          {p.wizardStep === 1 && (
            <div className="space-y-4">
              <div className="mb-2">
                <h2 className="text-xl font-semibold text-foreground">Add your headshots</h2>
                <p className="text-sm text-muted-foreground mt-1">At least one photo is required. The first becomes your avatar.</p>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {p.headshots.map((url, i) => (
                  <div key={i} className="relative aspect-square rounded-lg overflow-hidden border border-border bg-secondary group">
                    <img src={url} alt={`headshot ${i + 1}`} className="w-full h-full object-cover" />
                    <button type="button" onClick={() => p.setHeadshots(p.headshots.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <X className="w-3.5 h-3.5" />
                    </button>
                    {i === 0 && <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/60 text-white rounded text-[9px] font-bold uppercase">Primary</div>}
                  </div>
                ))}
                {p.headshots.length < 8 && (
                  <button type="button" onClick={() => hsInputRef.current?.click()} disabled={hsUploading}
                    className="aspect-square rounded-lg border-2 border-dashed border-border bg-secondary/40 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors disabled:opacity-50">
                    {hsUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                    <span className="text-[10px] font-medium">{hsUploading ? "Uploading…" : "Add photo"}</span>
                  </button>
                )}
              </div>
              <input ref={hsInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleHeadshotFiles} />
            </div>
          )}

          {/* Step 3 — Showreel */}
          {p.wizardStep === 2 && (
            <div className="space-y-4">
              <div className="mb-2">
                <h2 className="text-xl font-semibold text-foreground">Add a showreel</h2>
                <p className="text-sm text-muted-foreground mt-1">Optional, but strongly recommended. Record now, upload a file, or paste a link.</p>
              </div>
              <div className="rounded-xl border border-border overflow-hidden">
                <ReelRecorder reelType="reel" onRecordingComplete={(blob) => p.uploadReelVideo(blob)} />
              </div>
              <div className="flex items-center gap-2">
                <input ref={p.reelFileRef} type="file" accept="video/*" className="hidden" onChange={p.handleReelFile} />
                <button type="button" onClick={() => p.reelFileRef.current?.click()} disabled={p.reelUploading}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border bg-secondary hover:bg-card transition-colors disabled:opacity-50">
                  {p.reelUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {p.reelUploading ? "Uploading…" : "Upload video file"}
                </button>
                {p.newReel.video_url && !p.reelUploading && (
                  <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle2 className="w-3.5 h-3.5" /> Video ready</span>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Or paste an embed URL</label>
                <Input value={p.newReel.video_url} onChange={e => p.setNewReel(prev => ({ ...prev, video_url: e.target.value }))} placeholder="https://youtube.com/embed/…" className="bg-secondary border-border text-sm" />
              </div>
            </div>
          )}

          {/* Nav */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-border">
            <button type="button"
              onClick={() => { p.setWizardError(""); if (p.wizardStep === 0) p.router.push("/explore"); else p.setWizardStep(p.wizardStep - 1); }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              {p.wizardStep === 0 ? "Cancel" : "Back"}
            </button>

            {p.wizardStep < WIZARD_STEPS.length - 1 ? (
              <button type="button"
                onClick={() => {
                  p.setWizardError("");
                  if (p.wizardStep === 0 && !step1Valid) { p.setWizardError("Please fill in name, discipline, location and bio."); return; }
                  if (p.wizardStep === 1 && !step2Valid) { p.setWizardError("Please add at least one photo."); return; }
                  p.setWizardStep(p.wizardStep + 1);
                }}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" disabled={p.finishing} onClick={p.finishSetup}
                className="px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-1.5 disabled:opacity-60">
                {p.finishing ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving…</> : <>Finish &amp; enter StageLink</>}
              </button>
            )}
          </div>

          {p.wizardStep === 2 && p.newReel.video_url && (
            <p className="text-[11px] text-muted-foreground mt-3 text-center">Your showreel will be saved when you finish.</p>
          )}
        </div>
      </div>
    </div>
  );
}

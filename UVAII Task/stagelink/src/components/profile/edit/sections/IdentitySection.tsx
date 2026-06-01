import { useProfile } from "../ProfileContext";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { AGE_MIN, AGE_MAX, clampInt, todayISO } from "@/lib/validation";

const BIO_MAX = 2000;

function Label({ children, hint, lock }: { children: React.ReactNode; hint?: string; lock?: boolean }) {
  return (
    <div className="mb-2">
      <label className="text-[13px] font-semibold text-foreground/80 tracking-wide inline-flex items-center gap-1.5">
        {children}
        {lock && <Lock className="w-3 h-3 text-muted-foreground" />}
      </label>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

export function IdentitySection() {
  const {
    talentName, setTalentName,
    legalName, setLegalName,
    pronouns, setPronouns,
    dob, setDob,
    tagline, setTagline,
    playableMin, setPlayableMin,
    playableMax, setPlayableMax,
    bio, setBio,
    agency, setAgency,
  } = useProfile();

  const ageError =
    playableMin !== "" && playableMax !== "" && Number(playableMin) > Number(playableMax)
      ? "Minimum playable age can't be greater than the maximum."
      : "";

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Identity</h2>
        <p className="text-sm text-muted-foreground mt-1">Your public stage name and private legal details.</p>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Basic Info</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <Label>Stage name *</Label>
              <Input value={talentName} onChange={e => setTalentName(e.target.value)} placeholder="Your stage name" className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" />
            </div>
            <div>
              <Label lock hint="Only visible to you">Legal name</Label>
              <Input value={legalName} onChange={e => setLegalName(e.target.value)} placeholder="Full legal name" className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" />
            </div>
            <div>
              <Label>Pronouns</Label>
              <Input value={pronouns} onChange={e => setPronouns(e.target.value)} placeholder="e.g. she/her, they/them" className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" />
            </div>
            <div>
              <Label lock hint="Only visible to you">Date of birth</Label>
              <Input type="date" max={todayISO()} value={dob} onChange={e => setDob(e.target.value)} className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-5">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">Casting Details</h3>
          
          <div className="grid grid-cols-2 gap-5">
            <div>
              <Label hint="Youngest age you'd play">Playable age min</Label>
              <Input type="number" inputMode="numeric" min={AGE_MIN} max={AGE_MAX} value={playableMin}
                onChange={e => setPlayableMin(clampInt(e.target.value, AGE_MIN, AGE_MAX))}
                placeholder="e.g. 18" className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" />
            </div>
            <div>
              <Label hint="Oldest age you'd play">Playable age max</Label>
              <Input type="number" inputMode="numeric" min={AGE_MIN} max={AGE_MAX} value={playableMax}
                onChange={e => setPlayableMax(clampInt(e.target.value, AGE_MIN, AGE_MAX))}
                placeholder="e.g. 35" className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" />
            </div>
          </div>
          {ageError && <p className="text-xs text-destructive -mt-2">{ageError}</p>}

          <div>
            <Label hint={`${tagline.length}/200`}>Tagline</Label>
            <textarea
              value={tagline}
              onChange={e => setTagline(e.target.value.slice(0, 200))}
              rows={2}
              placeholder="A short memorable phrase about your work…"
              className="w-full bg-secondary/50 border border-border/60 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 focus:bg-background transition-all resize-none"
            />
          </div>
          <div>
            <Label hint={`${bio.length}/${BIO_MAX}`}>Bio</Label>
            <textarea value={bio} onChange={e => setBio(e.target.value.slice(0, BIO_MAX))} rows={4} maxLength={BIO_MAX}
              placeholder="Tell casting directors about yourself…"
              className="w-full bg-secondary/50 border border-border/60 rounded-lg px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 focus:bg-background transition-all resize-none" />
          </div>
          <div>
            <Label hint="Your representation or management agency">Agency</Label>
            <Input value={agency} onChange={e => setAgency(e.target.value)} placeholder="e.g. Creative Artists Agency" className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" />
          </div>
        </div>
      </div>
    </div>
  );
}

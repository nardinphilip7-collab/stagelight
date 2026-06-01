import { useProfile } from "../ProfileContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Plus, X, Lock } from "lucide-react";
import { MAX_MULTI_ITEMS } from "@/lib/validation";
import { useState } from "react";

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

function TagInput({ values, onChange, placeholder }: { values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [inp, setInp] = useState("");
  const add = () => {
    const v = inp.trim();
    if (v && !values.includes(v) && values.length < MAX_MULTI_ITEMS) onChange([...values, v]);
    setInp("");
  };
  return (
    <div>
      <div className="flex gap-2 mb-3">
        <Input value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? "Type and press Enter"}
          className="bg-secondary/50 border-border/60 focus:bg-background transition-colors text-sm flex-1" />
        <button type="button" onClick={add} className="px-4 rounded-lg border border-border/60 bg-secondary/30 text-muted-foreground hover:bg-secondary hover:text-foreground transition-all">
          <Plus className="w-4 h-4" />
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {values.map((v, i) => (
          <Badge key={i} variant="secondary" className="pl-3 pr-1.5 py-1 flex items-center gap-1.5 text-xs font-medium rounded-full border border-border/40">
            {v}
            <button onClick={() => onChange(values.filter((_, j) => j !== i))} className="hover:text-destructive transition-colors opacity-70 hover:opacity-100">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
}

// Must match ArtistProfile.DISCIPLINE_CHOICES on the backend, otherwise the
// artist PATCH is rejected with a 400 and the whole save fails.
const DISCIPLINE_OPTIONS = [
  "actor", "singer", "dancer", "musician", "voice_actor", "comedian", "presenter",
  "director", "choreographer", "composer", "screenwriter", "cinematographer",
  "visual_artist", "model", "stage_technician",
];

const DISCIPLINE_LABELS: Record<string, string> = {
  actor: "Actor", singer: "Singer", dancer: "Dancer", musician: "Musician",
  voice_actor: "Voice Actor", comedian: "Comedian", presenter: "Presenter",
  director: "Director", choreographer: "Choreographer", composer: "Composer",
  screenwriter: "Screenwriter", cinematographer: "Cinematographer",
  visual_artist: "Visual Artist", model: "Model", stage_technician: "Stage Technician"
};

const SKILL_CATEGORIES = [
  { key: "language", label: "Languages" },
  { key: "accent", label: "Accents & Dialects" },
  { key: "instrument", label: "Instruments" },
  { key: "dance_style", label: "Dance Styles" },
  { key: "vocal_style", label: "Vocal Styles" },
  { key: "combat", label: "Stage Combat / Martial Arts" },
  { key: "sport", label: "Sports & Athletics" },
  { key: "driving", label: "Driving & Licenses" },
  { key: "circus", label: "Circus & Specialty" },
];
// SkillLevel enum (shared across languages, accents, instruments, dance styles, …).
const SKILL_PROFICIENCY = ["Beginner", "Intermediate", "Advanced", "Fluent", "Native", "Expert"];

export function DisciplinesSection() {
  const {
    primaryDiscipline, setPrimaryDiscipline,
    subDisciplines, setSubDisciplines,
    secondaryDisciplines, setSecondaryDisciplines,
    skillEntries, newSkill, setNewSkill, addSkillEntry, removeSkillEntry
  } = useProfile();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Disciplines & Skills</h2>
        <p className="text-sm text-muted-foreground mt-1">Showcase your main discipline, specializations, and unique skills.</p>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-6">
          <div>
            <Label>Primary discipline</Label>
            <div className="flex flex-wrap gap-2.5">
              {DISCIPLINE_OPTIONS.map(d => (
                <button key={d} type="button" onClick={() => setPrimaryDiscipline(d)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
                    primaryDiscipline === d 
                      ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20 scale-105" 
                      : "bg-secondary/40 border-border/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}>
                  {primaryDiscipline === d && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 -ml-1" />}
                  {DISCIPLINE_LABELS[d] ?? d}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/40">
            <div>
              <Label hint="Additional disciplines you work in">Sub-disciplines / Specialisations</Label>
              <TagInput values={subDisciplines} onChange={setSubDisciplines} placeholder="e.g. theater actor, voiceover" />
            </div>
            <div>
              <Label hint="Other major disciplines">Secondary disciplines</Label>
              <TagInput values={secondaryDisciplines} onChange={setSecondaryDisciplines} placeholder="e.g. dancer, writer" />
            </div>
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-6">Skills</h3>
          
          <div className="space-y-5">
            {SKILL_CATEGORIES.map(({ key, label }) => {
              const categorySkills = skillEntries.filter(s => s.category === key);
              const nsk = newSkill[key] ?? { name: "", proficiency: "" };
              return (
                <div key={key} className="p-4 bg-secondary/20 rounded-xl border border-border/40 transition-colors hover:bg-secondary/30">
                  <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest mb-3">{label}</p>
                  
                  {categorySkills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {categorySkills.map(s => (
                        <span key={s.id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border/60 text-xs font-medium shadow-sm">
                          {s.name}
                          {s.proficiency && <span className="text-muted-foreground opacity-70 font-normal">· {s.proficiency}</span>}
                          <button onClick={() => s.id && removeSkillEntry(s.id)} className="text-muted-foreground hover:text-destructive transition-colors ml-1 opacity-60 hover:opacity-100">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Input value={nsk.name} onChange={e => setNewSkill(prev => ({ ...prev, [key]: { ...nsk, name: e.target.value } }))}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSkillEntry(key); } }}
                      placeholder={`Add ${label.toLowerCase()}…`} className="bg-background border-border/60 text-xs flex-1 focus:ring-primary/20" />
                    
                    <div className="flex gap-2">
                      <select value={nsk.proficiency}
                        onChange={e => setNewSkill(prev => ({ ...prev, [key]: { ...nsk, proficiency: e.target.value } }))}
                        className="bg-background border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all min-w-[120px]">
                        <option value="" className="text-muted-foreground">Level</option>
                        {SKILL_PROFICIENCY.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                      <button type="button" onClick={() => addSkillEntry(key)} className="px-4 rounded-lg border border-border/60 bg-secondary/50 hover:bg-primary/10 hover:text-primary transition-colors flex items-center justify-center">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

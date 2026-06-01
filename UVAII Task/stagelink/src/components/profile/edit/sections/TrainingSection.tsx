import { useProfile } from "../ProfileContext";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { sanitizeDigits, isPlausibleYear, YEAR_MIN, YEAR_MAX } from "@/lib/validation";

export function TrainingSection() {
  const { training, setTraining, newTraining, setNewTraining } = useProfile();
  const [err, setErr] = useState("");

  function addEntry() {
    if (!newTraining.school.trim()) { setErr("School / institution is required."); return; }
    const { start_year, end_year } = newTraining;
    if (!isPlausibleYear(start_year) || !isPlausibleYear(end_year)) {
      setErr(`Years must be 4 digits between ${YEAR_MIN} and ${YEAR_MAX}.`); return;
    }
    if (start_year && end_year && Number(start_year) > Number(end_year)) {
      setErr("Start year can't be after the end year."); return;
    }
    setErr("");
    setTraining(prev => [...prev, { ...newTraining }]);
    setNewTraining({ school: "", program: "", degree: "", start_year: "", end_year: "", instructor: "", type: "school" });
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Education & Training</h2>
        <p className="text-sm text-muted-foreground mt-1">List your formal education, masterclasses, and specialized training.</p>
      </div>

      <div className="space-y-6">
        {training.length > 0 && (
          <div className="space-y-3">
            {training.map((t, i) => (
              <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5 mb-1">
                    <p className="font-semibold text-[15px]">{t.school}</p>
                    {t.type && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize tracking-wide">
                        {t.type}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-1 font-medium">{t.program}</p>
                  <p className="text-xs text-muted-foreground/80 flex items-center gap-1.5">
                    <span>
                      {t.start_year ? `${t.start_year}${t.end_year ? `–${t.end_year}` : "–present"}` : "Ongoing"}
                    </span>
                    {t.instructor && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>Instructor: {t.instructor}</span>
                      </>
                    )}
                  </p>
                </div>
                <button onClick={() => setTraining(prev => prev.filter((_, j) => j !== i))} 
                  className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-6 rounded-xl bg-secondary/30 border border-border/40 space-y-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Add training</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input value={newTraining.school} onChange={e => setNewTraining(p => ({ ...p, school: e.target.value }))} placeholder="School / institution" className="bg-background border-border/60 focus:bg-background transition-colors" />
            <Input value={newTraining.program ?? ""} onChange={e => setNewTraining(p => ({ ...p, program: e.target.value }))} placeholder="Programme / course" className="bg-background border-border/60 focus:bg-background transition-colors" />
            <Input value={newTraining.degree ?? ""} onChange={e => setNewTraining(p => ({ ...p, degree: e.target.value }))} placeholder="Degree / qualification" className="bg-background border-border/60 focus:bg-background transition-colors" />
            
            <div className="grid grid-cols-2 gap-3">
              <Input value={newTraining.start_year ?? ""} inputMode="numeric" maxLength={4}
                onChange={e => setNewTraining(p => ({ ...p, start_year: sanitizeDigits(e.target.value, 4) }))}
                placeholder="Start year" className="bg-background border-border/60 focus:bg-background transition-colors" />
              <Input value={newTraining.end_year ?? ""} inputMode="numeric" maxLength={4}
                onChange={e => setNewTraining(p => ({ ...p, end_year: sanitizeDigits(e.target.value, 4) }))}
                placeholder="End year" className="bg-background border-border/60 focus:bg-background transition-colors" />
            </div>
            
            <Input value={newTraining.instructor ?? ""} onChange={e => setNewTraining(p => ({ ...p, instructor: e.target.value }))} placeholder="Instructor name" className="bg-background border-border/60 focus:bg-background transition-colors" />
            
            <select value={newTraining.type ?? "school"} onChange={e => setNewTraining(p => ({ ...p, type: e.target.value }))}
              className="bg-background border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all w-full">
              <option value="school">School / programme</option>
              <option value="certification">Certification</option>
              <option value="workshop">Workshop</option>
              <option value="masterclass">Masterclass</option>
            </select>
          </div>

          {err && <p className="text-xs text-destructive">{err}</p>}
          <div className="pt-2">
            <button type="button"
              onClick={addEntry}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 w-fit">
              <Plus className="w-4 h-4" /> Add entry
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

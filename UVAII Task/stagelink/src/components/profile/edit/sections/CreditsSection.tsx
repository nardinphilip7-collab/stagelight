import { useProfile } from "../ProfileContext";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { sanitizeDigits } from "@/lib/validation";

export function CreditsSection() {
  const { credits, setCredits, removeCredit, newCredit, setNewCredit, addCredit } = useProfile();

  const PRODUCTION_TYPES = [
    "film", "tv", "theater", "commercial", "music_video", "short_film", "web_series"
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Credits</h2>
        <p className="text-sm text-muted-foreground mt-1">Add your professional performance and production credits.</p>
      </div>

      <div className="space-y-6">
        {credits.length > 0 && (
          <div className="space-y-3">
            {credits.map((c, i) => (
              <div key={c.id ?? i} className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border/50 shadow-sm transition-all hover:shadow-md">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-[15px]">{c.title}</p>
                    {c.production_type && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-foreground uppercase tracking-wider">
                        {c.production_type.replace(/_/g, " ")}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-primary mb-1">{c.role}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    {c.year && <span>{c.year}</span>}
                    {c.director && (
                      <>
                        {c.year && <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />}
                        <span>Dir: {c.director}</span>
                      </>
                    )}
                    {c.billing && (
                      <>
                        {(c.year || c.director) && <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />}
                        <span>{c.billing}</span>
                      </>
                    )}
                  </p>
                </div>
                <button onClick={() => removeCredit(c.id, i)} 
                  className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="p-6 rounded-xl bg-secondary/30 border border-border/40 space-y-5">
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Add credit</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input value={newCredit.title} onChange={e => setNewCredit(p => ({ ...p, title: e.target.value }))} placeholder="Production title" className="bg-background border-border/60 focus:bg-background transition-colors" />
            <Input value={newCredit.role} onChange={e => setNewCredit(p => ({ ...p, role: e.target.value }))} placeholder="Your role" className="bg-background border-border/60 focus:bg-background transition-colors" />
            
            <select value={newCredit.production_type ?? ""} onChange={e => setNewCredit(p => ({ ...p, production_type: e.target.value }))}
              className="bg-background border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all w-full">
              <option value="" className="text-muted-foreground">Production type</option>
              {PRODUCTION_TYPES.map(t => (
                <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
              ))}
            </select>
            
            <Input inputMode="numeric" maxLength={4} value={newCredit.year ?? ""} onChange={e => { const d = sanitizeDigits(e.target.value, 4); setNewCredit(p => ({ ...p, year: d ? parseInt(d, 10) : undefined })); }} placeholder="Year" className="bg-background border-border/60 focus:bg-background transition-colors" />
            
            <select value={newCredit.billing ?? ""} onChange={e => setNewCredit(p => ({ ...p, billing: e.target.value }))}
              className="bg-background border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all w-full">
              <option value="" className="text-muted-foreground">Billing (Optional)</option>
              <option value="Lead">Lead</option>
              <option value="Supporting">Supporting</option>
              <option value="Guest Star">Guest Star</option>
              <option value="Co-Star">Co-Star</option>
              <option value="Featured">Featured</option>
              <option value="Background">Background</option>
              <option value="Ensemble">Ensemble</option>
              <option value="Swing / Understudy">Swing / Understudy</option>
            </select>

            <Input value={newCredit.director ?? ""} onChange={e => setNewCredit(p => ({ ...p, director: e.target.value }))} placeholder="Director / Creator (Optional)" className="bg-background border-border/60 focus:bg-background transition-colors" />
          </div>

          <div className="pt-2">
            <button type="button"
              onClick={addCredit}
              className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 w-fit">
              <Plus className="w-4 h-4" /> Add credit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

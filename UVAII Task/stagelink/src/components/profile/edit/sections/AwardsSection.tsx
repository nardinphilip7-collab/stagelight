import { useProfile } from "../ProfileContext";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { sanitizeDigits, isPlausibleYear, isValidHttpUrl, YEAR_MIN, YEAR_MAX } from "@/lib/validation";

export function AwardsSection() {
  const { awards, setAwards, newAward, setNewAward, pressMentions, setPressMentions, newPressMention, setNewPressMention } = useProfile();
  const [awardErr, setAwardErr] = useState("");
  const [pressErr, setPressErr] = useState("");

  function addAward() {
    if (!newAward.name.trim()) { setAwardErr("Award name is required."); return; }
    if (!isPlausibleYear(newAward.year)) { setAwardErr(`Year must be 4 digits between ${YEAR_MIN} and ${YEAR_MAX}.`); return; }
    if (!isValidHttpUrl(newAward.url)) { setAwardErr("Link must be a valid http(s) URL."); return; }
    setAwardErr("");
    setAwards(prev => [...prev, { ...newAward }]);
    setNewAward({ name: "", festival: "", project: "", year: "", url: "", award_type: "won" });
  }

  function addPress() {
    if (!newPressMention.publication.trim() || !newPressMention.headline.trim()) {
      setPressErr("Publication and headline are required."); return;
    }
    if (!isValidHttpUrl(newPressMention.url)) { setPressErr("Article link must be a valid http(s) URL."); return; }
    setPressErr("");
    setPressMentions(prev => [...prev, { ...newPressMention }]);
    setNewPressMention({ publication: "", headline: "", date: "", url: "" });
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Awards & Press</h2>
        <p className="text-sm text-muted-foreground mt-1">Highlight your industry recognition and media coverage.</p>
      </div>

      <div className="space-y-8">
        {/* Awards */}
        <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Awards & Nominations</h3>
          </div>

          {awards.length > 0 && (
            <div className="space-y-3">
              {awards.map((a, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/40 transition-all hover:bg-secondary/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-1">
                      <p className="font-semibold text-[15px]">{a.name}</p>
                      {a.award_type && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize tracking-wide">
                          {a.award_type}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-foreground/80 mb-1">{a.festival}{a.year ? ` (${a.year})` : ""}</p>
                    {a.project && <p className="text-xs text-muted-foreground">Project: <span className="font-medium text-foreground/70">{a.project}</span></p>}
                    {a.url && <a href={a.url} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline mt-1 block">View link</a>}
                  </div>
                  <button onClick={() => setAwards(prev => prev.filter((_, j) => j !== i))} 
                    className="w-8 h-8 rounded-full bg-background border border-border/50 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-5 rounded-xl bg-secondary/20 border border-border/40 space-y-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Add award</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input value={newAward.name} onChange={e => setNewAward(p => ({ ...p, name: e.target.value }))} placeholder="Award name (e.g. Best Actor)" className="bg-background border-border/60 focus:bg-background transition-colors" />
              <Input value={newAward.festival ?? ""} onChange={e => setNewAward(p => ({ ...p, festival: e.target.value }))} placeholder="Festival / organization" className="bg-background border-border/60 focus:bg-background transition-colors" />
              <Input value={newAward.project ?? ""} onChange={e => setNewAward(p => ({ ...p, project: e.target.value }))} placeholder="Project title" className="bg-background border-border/60 focus:bg-background transition-colors" />
              
              <div className="grid grid-cols-2 gap-3">
                <Input inputMode="numeric" maxLength={4} value={newAward.year ?? ""} onChange={e => setNewAward(p => ({ ...p, year: sanitizeDigits(e.target.value, 4) }))} placeholder="Year" className="bg-background border-border/60 focus:bg-background transition-colors" />
                <select value={newAward.award_type ?? "won"} onChange={e => setNewAward(p => ({ ...p, award_type: e.target.value }))}
                  className="bg-background border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all w-full">
                  <option value="won">Won</option>
                  <option value="nominated">Nominated</option>
                  <option value="official_selection">Official Selection</option>
                </select>
              </div>
              <div className="col-span-1 md:col-span-2">
                <Input value={newAward.url ?? ""} onChange={e => setNewAward(p => ({ ...p, url: e.target.value }))} placeholder="Link (optional)" className="bg-background border-border/60 focus:bg-background transition-colors" />
              </div>
            </div>

            {awardErr && <p className="text-xs text-destructive">{awardErr}</p>}
            <div className="pt-2">
              <button type="button"
                onClick={addAward}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 w-fit">
                <Plus className="w-4 h-4" /> Add award
              </button>
            </div>
          </div>
        </div>

        {/* Press */}
        <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Press Mentions</h3>
          </div>

          {pressMentions.length > 0 && (
            <div className="space-y-3">
              {pressMentions.map((p, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/40 transition-all hover:bg-secondary/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] mb-1">{p.headline}</p>
                    <p className="text-sm text-muted-foreground mb-1">{p.publication}{p.date ? ` · ${p.date}` : ""}</p>
                    {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline block">Read article</a>}
                  </div>
                  <button onClick={() => setPressMentions(prev => prev.filter((_, j) => j !== i))} 
                    className="w-8 h-8 rounded-full bg-background border border-border/50 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-5 rounded-xl bg-secondary/20 border border-border/40 space-y-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Add press mention</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input value={newPressMention.publication} onChange={e => setNewPressMention(p => ({ ...p, publication: e.target.value }))} placeholder="Publication name" className="bg-background border-border/60 focus:bg-background transition-colors" />
              <Input type="date" value={newPressMention.date ?? ""} onChange={e => setNewPressMention(p => ({ ...p, date: e.target.value }))} className="bg-background border-border/60 focus:bg-background transition-colors" />
              <div className="col-span-1 md:col-span-2">
                <Input value={newPressMention.headline} onChange={e => setNewPressMention(p => ({ ...p, headline: e.target.value }))} placeholder="Headline or quote" className="bg-background border-border/60 focus:bg-background transition-colors" />
              </div>
              <div className="col-span-1 md:col-span-2">
                <Input value={newPressMention.url ?? ""} onChange={e => setNewPressMention(p => ({ ...p, url: e.target.value }))} placeholder="Article link" className="bg-background border-border/60 focus:bg-background transition-colors" />
              </div>
            </div>

            {pressErr && <p className="text-xs text-destructive">{pressErr}</p>}
            <div className="pt-2">
              <button type="button"
                onClick={addPress}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 w-fit">
                <Plus className="w-4 h-4" /> Add press mention
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

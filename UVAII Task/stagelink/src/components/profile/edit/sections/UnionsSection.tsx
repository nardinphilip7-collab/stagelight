import { useProfile } from "../ProfileContext";
import { Input } from "@/components/ui/input";
import { Plus, X } from "lucide-react";
import { sanitizeDigits, isValidEmail } from "@/lib/validation";

export function UnionsSection() {
  const { unions, setUnions, newUnion, setNewUnion, representation, setRepresentation, addUnion, removeUnion } = useProfile();
  const agentEmailInvalid = !isValidEmail(representation?.agent_email as string | undefined);

  const UNION_OPTIONS = [
    "SAG-AFTRA", "Equity (UK)", "Actors' Equity Association (AEA)",
    "BECTU", "WGA", "DGA", "PGA", "Musicians' Union (UK)", "AFM", "Other"
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Unions & Representation</h2>
        <p className="text-sm text-muted-foreground mt-1">Add your union affiliations and agency details.</p>
      </div>

      <div className="space-y-8">
        
        {/* Representation */}
        <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Representation</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-2 block">Agency Name</label>
              <Input 
                value={representation?.agency ?? ""} 
                onChange={e => setRepresentation(p => ({ ...p, agency: e.target.value }))} 
                placeholder="e.g. CAA, WME" 
                className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" 
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-2 block">Agent Name</label>
              <Input 
                value={representation?.agent_name ?? ""} 
                onChange={e => setRepresentation(p => ({ ...p, agent_name: e.target.value }))} 
                placeholder="Agent's full name" 
                className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" 
              />
            </div>
            <div>
              <label className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-2 block">Agent Email</label>
              <Input
                type="email"
                value={representation?.agent_email ?? ""}
                onChange={e => setRepresentation(p => ({ ...p, agent_email: e.target.value }))}
                placeholder="agent@agency.com"
                aria-invalid={agentEmailInvalid}
                className="bg-secondary/50 border-border/60 focus:bg-background transition-colors"
              />
              {agentEmailInvalid && <p className="text-xs text-destructive mt-1">Enter a valid email address.</p>}
            </div>
            <div>
              <label className="text-[13px] font-semibold text-foreground/80 tracking-wide mb-2 block">Agent Phone</label>
              <Input 
                type="tel"
                value={representation?.agent_phone ?? ""} 
                onChange={e => setRepresentation(p => ({ ...p, agent_phone: e.target.value }))} 
                placeholder="+1 555-0123" 
                className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" 
              />
            </div>
          </div>
        </div>

        {/* Unions */}
        <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-6">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Union Affiliations</h3>

          {unions.length > 0 && (
            <div className="space-y-3">
              {unions.map((u, i) => (
                <div key={u.id ?? i} className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 border border-border/40 transition-all hover:bg-secondary/50">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[15px] mb-0.5">{u.union}</p>
                    <p className="text-sm text-muted-foreground">
                      {u.status || "Member"} {u.joined_year && `· Since ${u.joined_year}`}
                    </p>
                  </div>
                  <button onClick={() => removeUnion(u.id, i)} 
                    className="w-8 h-8 rounded-full bg-background border border-border/50 flex items-center justify-center text-muted-foreground hover:text-destructive hover:border-destructive/30 hover:bg-destructive/10 transition-colors shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="p-5 rounded-xl bg-secondary/20 border border-border/40 space-y-4">
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Add union</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1">
                <select value={UNION_OPTIONS.includes(newUnion.union) ? newUnion.union : (newUnion.union ? "Other" : "")} 
                  onChange={e => setNewUnion(p => ({ ...p, union: e.target.value === "Other" ? "" : e.target.value }))}
                  className="bg-background border border-border/60 rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-primary/30 transition-all w-full">
                  <option value="" className="text-muted-foreground">Select union</option>
                  {UNION_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                {(!UNION_OPTIONS.includes(newUnion.union) && newUnion.union !== "" || newUnion.union === "Other") && (
                  <Input value={newUnion.union === "Other" ? "" : newUnion.union} onChange={e => setNewUnion(p => ({ ...p, union: e.target.value }))} placeholder="Type union name" className="bg-background border-border/60 focus:bg-background transition-colors mt-2" />
                )}
              </div>
              
              <Input value={newUnion.status ?? ""} onChange={e => setNewUnion(p => ({ ...p, status: e.target.value }))} placeholder="Status (e.g. Fi-Core, Member)" className="bg-background border-border/60 focus:bg-background transition-colors" />
              
              <Input inputMode="numeric" maxLength={4} value={newUnion.joined_year ?? ""} onChange={e => { const d = sanitizeDigits(e.target.value, 4); setNewUnion(p => ({ ...p, joined_year: d ? parseInt(d, 10) : undefined })); }} placeholder="Joined year" className="bg-background border-border/60 focus:bg-background transition-colors" />
            </div>

            <div className="pt-2">
              <button type="button"
                onClick={addUnion}
                className="flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 w-fit">
                <Plus className="w-4 h-4" /> Add union
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

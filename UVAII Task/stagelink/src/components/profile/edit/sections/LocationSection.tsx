import { useProfile } from "../ProfileContext";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, X, Lock } from "lucide-react";
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
    if (v && !values.includes(v)) onChange([...values, v]);
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

export function LocationSection() {
  const { location, setLocation, travelInfo, setTravelInfo } = useProfile();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Location & Travel</h2>
        <p className="text-sm text-muted-foreground mt-1">Specify where you are based and where you are willing to work.</p>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-6">
        <div>
          <Label>Home market *</Label>
          <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. London, UK" className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/40">
          <div>
            <Label hint="Cities where you have accommodation">Works locally in</Label>
            <TagInput values={travelInfo.works_local_cities ?? []}
              onChange={v => setTravelInfo((p: any) => ({ ...p, works_local_cities: v }))}
              placeholder="e.g. Manchester, Birmingham" />
          </div>
          <div>
            <Label>Passport / citizenship</Label>
            <TagInput values={travelInfo.passport_countries ?? []}
              onChange={v => setTravelInfo((p: any) => ({ ...p, passport_countries: v }))}
              placeholder="e.g. UK, Egypt" />
          </div>
        </div>

        <div>
          <Label>Visa / work permit notes</Label>
          <Input value={travelInfo.visa_notes ?? ""}
            onChange={e => setTravelInfo((p: any) => ({ ...p, visa_notes: e.target.value }))}
            placeholder="e.g. EU work authorisation, O-1 Visa (US)" className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" />
        </div>

        <div className="flex flex-col sm:flex-row gap-6 pt-4 border-t border-border/40">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${travelInfo.domestic_travel ? "bg-primary border-primary" : "border-border bg-secondary group-hover:border-primary/50"}`}>
              {travelInfo.domestic_travel && <svg className="w-3.5 h-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
            <input type="checkbox" className="hidden" checked={travelInfo.domestic_travel ?? false} onChange={e => setTravelInfo((p: any) => ({ ...p, domestic_travel: e.target.checked }))} />
            <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">Available for domestic travel</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${travelInfo.international_travel ? "bg-primary border-primary" : "border-border bg-secondary group-hover:border-primary/50"}`}>
              {travelInfo.international_travel && <svg className="w-3.5 h-3.5 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>}
            </div>
            <input type="checkbox" className="hidden" checked={travelInfo.international_travel ?? false} onChange={e => setTravelInfo((p: any) => ({ ...p, international_travel: e.target.checked }))} />
            <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">Available for international travel</span>
          </label>
        </div>
      </div>
    </div>
  );
}

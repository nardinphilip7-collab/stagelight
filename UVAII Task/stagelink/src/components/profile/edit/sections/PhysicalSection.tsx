import { useProfile } from "../ProfileContext";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";

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

export function PhysicalSection() {
  const { physicalStats, setPhysicalStats } = useProfile();

  const attributes = [
    ["height", "Height"], 
    ["weight", "Weight", true], 
    ["hair_color", "Hair colour"], 
    ["eye_color", "Eye colour"], 
    ["build", "Build"], 
    ["dress_size", "Dress/suit size", true], 
    ["shoe_size", "Shoe size"], 
    ["age_range", "Apparent age range"]
  ] as const;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Physical Attributes</h2>
        <p className="text-sm text-muted-foreground mt-1">Provide your measurements. Sensitive fields are private by default.</p>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {attributes.map(([key, lbl, priv]) => (
            <div key={key}>
              <Label lock={!!priv}>{lbl}</Label>
              <Input 
                value={physicalStats[key] ?? ""}
                onChange={e => setPhysicalStats(p => ({ ...p, [key]: e.target.value }))}
                placeholder="—" 
                className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" 
              />
            </div>
          ))}
        </div>
        
        <div className="pt-4 border-t border-border/40">
          <Label>Distinguishing features / tattoos</Label>
          <Input 
            value={physicalStats.distinguishing ?? ""}
            onChange={e => setPhysicalStats(p => ({ ...p, distinguishing: e.target.value }))}
            placeholder="e.g. small tattoo on left wrist, scar on chin" 
            className="bg-secondary/50 border-border/60 focus:bg-background transition-colors" 
          />
        </div>
      </div>
    </div>
  );
}

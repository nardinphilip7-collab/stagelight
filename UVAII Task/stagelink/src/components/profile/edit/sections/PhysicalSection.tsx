import { useProfile } from "../ProfileContext";
import { Input } from "@/components/ui/input";
import { Lock } from "lucide-react";
import { sanitizeDigits, isPositiveNumber } from "@/lib/validation";

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

const inputCls = "bg-secondary/50 border-border/60 focus:bg-background transition-colors";
const selectCls = "w-full bg-secondary/50 border border-border/60 rounded-lg px-3 h-9 text-sm text-foreground outline-none focus:bg-background focus:ring-1 focus:ring-primary/30 transition-all";

// Enum value sets (single-choice). Empty string = "not specified".
const EYE_COLORS = ["Brown", "Blue", "Green", "Hazel", "Grey", "Amber", "Other"];
const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red / Auburn", "Grey", "White", "Bald", "Other"];
const BUILDS = ["Slim", "Athletic", "Average", "Muscular", "Heavy", "Plus-size"];

export function PhysicalSection() {
  const { physicalStats, setPhysicalStats } = useProfile();

  const setStat = (key: string, value: string) => setPhysicalStats(p => ({ ...p, [key]: value }));

  // Numeric fields are stored as digit strings; height must be > 0 when present.
  const heightInvalid = !isPositiveNumber(physicalStats.height);

  // [key, label, unit, private]
  const numericFields: ReadonlyArray<readonly [string, string, string, boolean?]> = [
    ["height", "Height", "cm"],
    ["weight", "Weight", "kg", true],
    ["shoe_size", "Shoe size", "EU"],
  ];

  const enumFields: ReadonlyArray<readonly [string, string, string[]]> = [
    ["hair_color", "Hair colour", HAIR_COLORS],
    ["eye_color", "Eye colour", EYE_COLORS],
    ["build", "Build", BUILDS],
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Physical Attributes</h2>
        <p className="text-sm text-muted-foreground mt-1">Provide your measurements. Sensitive fields are private by default.</p>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
          {/* Numeric measurements */}
          {numericFields.map(([key, lbl, unit, priv]) => (
            <div key={key}>
              <Label lock={!!priv} hint={`In ${unit}`}>{lbl}</Label>
              <div className="relative">
                <Input
                  type="text"
                  inputMode="numeric"
                  value={physicalStats[key] ?? ""}
                  onChange={e => setStat(key, sanitizeDigits(e.target.value, 4))}
                  placeholder="—"
                  aria-invalid={key === "height" && heightInvalid}
                  className={`${inputCls} pr-12`}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">{unit}</span>
              </div>
              {key === "height" && heightInvalid && (
                <p className="text-xs text-destructive mt-1">Height must be greater than 0.</p>
              )}
            </div>
          ))}

          {/* Dress / suit size — number or string per spec */}
          <div>
            <Label lock hint="Number or label (e.g. 10 or M)">Dress / suit size</Label>
            <Input
              value={physicalStats.dress_size ?? ""}
              onChange={e => setStat("dress_size", e.target.value)}
              placeholder="—"
              className={inputCls}
            />
          </div>

          {/* Enum selects */}
          {enumFields.map(([key, lbl, options]) => (
            <div key={key}>
              <Label>{lbl}</Label>
              <select
                value={physicalStats[key] ?? ""}
                onChange={e => setStat(key, e.target.value)}
                className={selectCls}
              >
                <option value="">Not specified</option>
                {options.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          ))}

          {/* Apparent age range — free text descriptor */}
          <div>
            <Label hint="The age range you read as on screen">Apparent age range</Label>
            <Input
              value={physicalStats.age_range ?? ""}
              onChange={e => setStat("age_range", e.target.value)}
              placeholder="e.g. 25–35"
              className={inputCls}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-border/40">
          <Label>Distinguishing features / tattoos</Label>
          <Input
            value={physicalStats.distinguishing ?? ""}
            onChange={e => setStat("distinguishing", e.target.value)}
            placeholder="e.g. small tattoo on left wrist, scar on chin"
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}

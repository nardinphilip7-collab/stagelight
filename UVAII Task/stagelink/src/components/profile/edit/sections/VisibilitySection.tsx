import { useProfile } from "../ProfileContext";

export function VisibilitySection() {
  const { profileVisibility, setProfileVisibility } = useProfile();

  // Values must match Talent.profile_visibility choices on the backend
  // (public | platform_only | industry_only | stealth) or the save is rejected.
  const visibilityOptions = [
    { value: "public", label: "Public", desc: "Anyone can view your profile." },
    { value: "platform_only", label: "Registered Users", desc: "Only logged-in Stagelink users." },
    { value: "industry_only", label: "Casting & Hirers Only", desc: "Hidden from other talent." },
    { value: "stealth", label: "Hidden / Private", desc: "Only visible to you." },
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Visibility</h2>
        <p className="text-sm text-muted-foreground mt-1">Control who can see your profile on Stagelight.</p>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm">
        <div className="space-y-3">
          {visibilityOptions.map((s) => (
            <label key={s.value} className={`relative flex items-center p-4 cursor-pointer rounded-xl border transition-all ${
              profileVisibility === s.value 
                ? "border-primary bg-primary/5 shadow-sm" 
                : "border-border/60 bg-secondary/20 hover:border-border hover:bg-secondary/40"
            }`}>
              <input 
                type="radio" 
                name="profileVisibility" 
                value={s.value}
                checked={profileVisibility === s.value}
                onChange={(e) => setProfileVisibility(e.target.value)}
                className="hidden"
              />
              <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-4 transition-colors ${
                profileVisibility === s.value ? "border-primary bg-primary" : "border-muted-foreground/50 bg-background"
              }`}>
                {profileVisibility === s.value && <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />}
              </div>
              <div className="flex-1">
                <span className={`block font-semibold text-sm mb-0.5 ${profileVisibility === s.value ? 'text-foreground' : 'text-foreground/80'}`}>
                  {s.label}
                </span>
                <span className="block text-xs text-muted-foreground">{s.desc}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

import { useProfile } from "../ProfileContext";

export function DisciplineDetailsSection() {
  const { disciplineData } = useProfile();
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Discipline Details</h2>
        <p className="text-sm text-muted-foreground mt-1">Specific details related to your selected disciplines.</p>
      </div>

      <div className="p-6 rounded-xl bg-card border border-border/50 shadow-sm flex items-center justify-center min-h-[200px]">
        <p className="text-sm text-muted-foreground text-center">
          More discipline-specific fields will appear here based on your primary discipline.<br/>
          (Coming soon)
        </p>
      </div>
    </div>
  );
}
